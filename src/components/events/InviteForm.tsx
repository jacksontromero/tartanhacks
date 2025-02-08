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
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { useState } from 'react';

interface InviteFormProps {
  eventId: string;
  availableCuisines: string[];
  availablePriceRanges: string[];
}

export const eventResponseFormSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  dietaryRestrictions: z.array(z.string()),
  preferredCuisines: z.array(z.string()).min(1, {
    message: "Please select at least one preferred cuisine type.",
  }).max(5, {
    message: "You can only select up to 5 preferred cuisines.",
  }),
  rankedCuisines: z.array(z.string()),
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
  const [rankedCuisines, setRankedCuisines] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const form = useForm<z.infer<typeof eventResponseFormSchema>>({
    resolver: zodResolver(eventResponseFormSchema),
    defaultValues: {
      name: "",
      email: "",
      dietaryRestrictions: [],
      preferredCuisines: [],
      antiPreferredCuisines: [],
      acceptablePriceRanges: [],
      rankedCuisines: [],
      comments: "",
    },
  });

  const preferredCuisines = form.watch("preferredCuisines");
  const antiPreferredCuisines = form.watch("antiPreferredCuisines");

  function handleDragEnd(event: any) {
    const {active, over} = event;

    if (active.id !== over.id) {
      setRankedCuisines((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  async function onSubmit(values: z.infer<typeof eventResponseFormSchema>) {
    try {
      const submissionValues = {
        ...values,
        rankedCuisines,
      };

      // Since React Hook Form (with zodResolver) has already validated the form,
      // we don't need to re-validate here.
      const res = await fetch(`/api/events/${eventId}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionValues),
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData);
      }

      router.push(`/event/${eventId}/thanks`);

      const notifyRes = await fetch(`/api/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId }),
      });
      
      if (!notifyRes.ok) {
        throw new Error('Failed to submit RSVP');
      } else {
        console.log("Success in emailing RSVP")
      }

    } catch (error) {
      console.error("Failed to submit response:", error);
      form.setError("root", {
        type: "server",
        message: "Failed to submit response. Please check all fields and try again.",
      });
    }
  }

  const handlePreferredCuisinesChange = (values: string[]) => {
    form.setValue('preferredCuisines', values);
    setRankedCuisines(values);
  };

  // Get available price range objects based on the host's selection
  const availablePriceRangeObjects = PRICE_RANGES.filter(
    range => availablePriceRanges.includes(range.value)
  );

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
        >
          {/* {(
            <div className="text-red-500 text-sm">
              {form.formState.errors.root?.message}

              {form.formState.errors.email?.message}

              {form.formState.errors.dietaryRestrictions?.message}

              {form.formState.errors.preferredCuisines?.message}

              {form.formState.errors.antiPreferredCuisines?.message}

              {form.formState.errors.acceptablePriceRanges?.message}

              {form.formState.errors.rankedCuisines?.message}

              {form.formState.errors.comments?.message}
            </div>
          )} */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name here" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                <FormLabel>Preferred Cuisines (Max 5)</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={availableCuisines.map((cuisine) => ({
                      label: cuisine,
                      value: cuisine,
                      disabled: antiPreferredCuisines.includes(cuisine) ||
                              (field.value.length >= 5 && !field.value.includes(cuisine)),
                    }))}
                    defaultValue={field.value}
                    onValueChange={handlePreferredCuisinesChange}
                    placeholder="Select up to 5 cuisines you enjoy"
                  />
                </FormControl>
                <FormDescription>
                  Select up to 5 cuisines. You can rank them below.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {rankedCuisines.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Rank Your Preferred Cuisines</h3>
              <p className="text-sm text-gray-500">
                Drag and drop to order from most preferred (top) to least preferred (bottom)
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={rankedCuisines}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {rankedCuisines.map((cuisine) => (
                      <SortableItem key={cuisine} id={cuisine} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

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
                    placeholder="Select cuisines you refuse to eat (seriously, like veto the whole option)"
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
