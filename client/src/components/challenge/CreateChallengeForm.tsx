import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDays, addWeeks, format } from "date-fns";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

interface CreateChallengeFormProps {
  matches: any[];
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

const challengeSchema = z.object({
  matchId: z.number({
    required_error: "Please select a partner",
  }),
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(5, { message: "Description must be at least 5 characters" }),
  type: z.enum(["daily", "weekly", "one-time"], {
    required_error: "Please select a challenge type",
  }),
  totalSteps: z.number({
    required_error: "Please enter the number of steps",
  }).min(1, { message: "Must have at least 1 step" }).max(30, { message: "Cannot exceed 30 steps" }),
  startDate: z.date({
    required_error: "Please select a start date",
  }),
  endDate: z.date({
    required_error: "Please select an end date",
  }),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export default function CreateChallengeForm({ matches, onSubmit, isSubmitting }: CreateChallengeFormProps) {
  const [challengeType, setChallengeType] = useState<string>("daily");
  
  const form = useForm<z.infer<typeof challengeSchema>>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      matchId: matches.length > 0 ? matches[0].id : undefined,
      title: "",
      description: "",
      type: "daily",
      totalSteps: 7,
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
    },
  });
  
  // Update form when challenge type changes
  const handleTypeChange = (value: string) => {
    setChallengeType(value);
    
    // Update total steps and end date based on type
    const startDate = form.getValues("startDate");
    let totalSteps = 7;
    let endDate = startDate;
    
    switch (value) {
      case "daily":
        totalSteps = 7;
        endDate = addDays(startDate, 7);
        break;
      case "weekly":
        totalSteps = 4;
        endDate = addWeeks(startDate, 4);
        break;
      case "one-time":
        totalSteps = 1;
        endDate = addDays(startDate, 1);
        break;
    }
    
    form.setValue("totalSteps", totalSteps);
    form.setValue("endDate", endDate);
    form.setValue("type", value as any);
  };
  
  const handleSubmit = (values: z.infer<typeof challengeSchema>) => {
    onSubmit(values);
  };
  
  // Helper text based on challenge type
  const getStepsLabel = () => {
    switch (challengeType) {
      case "daily":
        return "Number of Days";
      case "weekly":
        return "Number of Weeks";
      case "one-time":
        return "Completion Steps";
      default:
        return "Steps";
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Match Selection */}
        <FormField
          control={form.control}
          name="matchId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Partner</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a partner" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {matches.map((match) => (
                    <SelectItem key={match.id} value={match.id.toString()}>
                      {match.otherUser.displayName} ({match.matchScore}% match)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the partner to complete this challenge with
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Challenge Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Challenge Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Daily Meditation Practice" {...field} />
              </FormControl>
              <FormDescription>
                A short, clear title for your challenge
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Challenge Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe what this challenge involves" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Provide details about what each person needs to do
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Challenge Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Challenge Type</FormLabel>
              <Select 
                onValueChange={(value) => handleTypeChange(value)}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select challenge type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="daily">Daily Challenge</SelectItem>
                  <SelectItem value="weekly">Weekly Challenge</SelectItem>
                  <SelectItem value="one-time">One-time Task</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {challengeType === "daily" 
                  ? "Track progress every day" 
                  : challengeType === "weekly"
                  ? "Track progress every week"
                  : "A single task to complete"
                }
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Number of Steps */}
        <FormField
          control={form.control}
          name="totalSteps"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{getStepsLabel()}</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1" 
                  max="30" 
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                {challengeType === "daily" 
                  ? "How many days to track (1-30)" 
                  : challengeType === "weekly"
                  ? "How many weeks to track (1-30)"
                  : "How many steps to complete the task (1-30)"
                }
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Date */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* End Date */}
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => 
                        date < new Date() || 
                        date < form.getValues("startDate")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Challenge"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
