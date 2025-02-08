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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  date: z.string(), // We'll validate this as a date string
  priceRange: z.enum(["$", "$$", "$$$", "$$$$"]),
  cuisinePreference: z.string().optional(),
  dietaryRestrictions: z.array(z.string()).default([]),
});

export default function CreateEventPage() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0], // Today's date as default
      priceRange: "$$",
      cuisinePreference: "",
      dietaryRestrictions: [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      router.push(`/event/${data.id}`);
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  }

  return (
    <main className="container mx-auto max-w-2xl p-6">
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-8 text-3xl font-bold text-secondary-foreground">
          Create New Event
        </h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Friday Night Dinner" {...field} />
                  </FormControl>
                  <FormDescription>
                    Give your event a memorable name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell your friends what this event is about..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priceRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price Range</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a price range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="$">$ (Under $15)</SelectItem>
                      <SelectItem value="$$">$$ ($15-$30)</SelectItem>
                      <SelectItem value="$$$">$$$ ($31-$60)</SelectItem>
                      <SelectItem value="$$$$">$$$$ (Over $60)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">Create Event</Button>
          </form>
        </Form>
      </div>
    </main>
  );
}
