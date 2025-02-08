"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Check, ChevronsUpDown } from "lucide-react";

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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { CUISINE_TYPES, LOCATIONS, PRICE_RANGES } from "~/constants/cuisines";
import { cn } from "~/lib/utils";
import { MultiSelect } from "~/components/ui/multi-select";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string({
    required_error: "Please select a location.",
  }),
  priceRanges: z.array(z.string()).min(1, {
    message: "Please select at least one price range.",
  }),
  cuisineTypes: z.array(z.string()).min(1, {
    message: "Please select at least one cuisine type.",
  }),
});

export default function CreateEventPage() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      startTime: "19:00",
      endTime: "21:00",
      location: "",
      priceRanges: [],
      cuisineTypes: [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const eventRes = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!eventRes.ok) {
        throw new Error('Failed to create event');
      }

      const event = await eventRes.json();
      router.push(`/event/${event.id}`);

      const selectedLocation = LOCATIONS.find(loc => loc.name === values.location);
      
      if (selectedLocation) {
        const placesRes = await fetch('/api/places', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_id: event.id,
            latitude: selectedLocation.lat,
            longitude: selectedLocation.lng
          })
        });
        
        if (!placesRes.ok) {
          console.error('Failed to fetch places');
        }
      }
    } catch (error) {
      console.error('Failed to submit:', error);
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

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
  control={form.control}
  name="location"
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel>Location</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between",
              !field.value && "text-muted-foreground"
            )}
          >
            {field.value
              ? LOCATIONS.find(
                  (location) => location.name === field.value
                )?.name
              : "Select location"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search location..." />
            <CommandList>
              <CommandEmpty>No location found.</CommandEmpty>
              <CommandGroup>
                {LOCATIONS.map((location, index) => (
                  <CommandItem
                    key={`${location.name}-${index}`}
                    value={location.name}
                    onSelect={() => {
                      form.setValue("location", location.name);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        location.name === field.value
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {location.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )}
/>
            <FormField
              control={form.control}
              name="priceRanges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price Ranges</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={PRICE_RANGES.map(range => ({
                        label: range.label,
                        value: range.value,
                      }))}
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select price ranges"
                      maxCount={4}
                    />
                  </FormControl>
                  <FormDescription>
                    Select all applicable price ranges for the event
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cuisineTypes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuisine Types</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={CUISINE_TYPES.map(cuisine => ({
                        label: cuisine,
                        value: cuisine,
                      }))}
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select cuisine types"
                      maxCount={5}
                    />
                  </FormControl>
                  <FormDescription>
                    Select all cuisine types you're interested in
                  </FormDescription>
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