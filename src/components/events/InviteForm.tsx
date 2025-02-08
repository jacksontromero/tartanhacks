"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { MultiSelect } from "~/components/ui/multi-select";
import { DIETARY_RESTRICTIONS } from "~/constants/dietary-restrictions";
import { PRICE_RANGES } from "~/constants/cuisines";

interface InviteFormProps {
  eventId: string;
  availableCuisines: string[];
  availablePriceRanges: string[];
}

const formSchema = z.object({
  email: z.string().email(),
  dietaryRestrictions: z.array(z.string()),
  preferredCuisines: z.array(z.string()).min(1, {
    message: "Please select at least one preferred cuisine type.",
  }),
  antiPreferredCuisines: z.array(z.string()),
  acceptablePriceRanges: z.array(z.string()).min(1, {
    message: "Please select at least one acceptable price range.",
  }),
  comments: z.string().optional(),
});

export default function InviteForm({
  eventId,
  availableCuisines,
  availablePriceRanges,
}: InviteFormProps) {
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      dietaryRestrictions: [],
      preferredCuisines: [],
      antiPreferredCuisines: [],
      acceptablePriceRanges: [],
      comments: "",
    },
  });

  const preferredCuisines = form.watch("preferredCuisines");
  const antiPreferredCuisines = form.watch("antiPreferredCuisines");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await fetch(`/api/events/${eventId}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      router.push(`/event/${eventId}/thanks`);
    } catch (error) {
      console.error("Failed to submit response:", error);
    }
  }

  // Get available price range objects based on the host's selection
  const availablePriceRangeObjects = PRICE_RANGES.filter(
    range => availablePriceRanges.includes(range.value)
  );

  return (
    <>

      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const values = form.getValues();
            onSubmit({ ...values });
          }}
          className="space-y-8"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="your@email.com" {...field} />
                </FormControl>
                <FormDescription>
                  We'll send you updates about the event
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dietaryRestrictions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dietary Restrictions</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={DIETARY_RESTRICTIONS.map(restriction => ({
                      label: restriction,
                      value: restriction,
                    }))}
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder="Search dietary restrictions..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preferredCuisines"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Cuisines</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={availableCuisines.map((cuisine) => ({
                      label: cuisine,
                      value: cuisine,
                      disabled: antiPreferredCuisines.includes(cuisine),
                    }))}
                    defaultValue={field.value}
                    onValueChange={(values) => {
                      field.onChange(values);
                    }}
                    placeholder="Select cuisines you enjoy"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="antiPreferredCuisines"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cuisines to Avoid</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={availableCuisines.map((cuisine) => ({
                      label: cuisine,
                      value: cuisine,
                      disabled: preferredCuisines.includes(cuisine),
                    }))}
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select cuisines you'd rather avoid"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="acceptablePriceRanges"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Acceptable Price Ranges</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={availablePriceRangeObjects.map(range => ({
                      label: range.label,
                      value: range.value,
                    }))}
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select acceptable price ranges"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="comments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Comments</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any other preferences or considerations?"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            Submit Preferences
          </Button>
        </form>
      </Form>
    </>
  );
}
