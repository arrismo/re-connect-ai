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
import { CalendarIcon, Sparkles } from "lucide-react";
import { AIChallengeGenerator } from "./AIChallengeGenerator";

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
  challengeType: z.enum(["generic", "days_sober", "check_in_streak"]).default("generic"),
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
  const [specialChallengeType, setSpecialChallengeType] = useState<string>("generic");
  
  const form = useForm<z.infer<typeof challengeSchema>>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      matchId: matches.length > 0 ? matches[0].id : undefined,
      title: "",
      description: "",
      type: "daily",
      challengeType: "generic",
      totalSteps: 7,
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
    },
  });
  
  // Handle AI generated challenge selection
  const handleAIChallengeSelect = (challenge: any) => {
    form.setValue("title", challenge.title);
    form.setValue("description", challenge.description);
    form.setValue("challengeType", challenge.challengeType);
    form.setValue("totalSteps", challenge.totalSteps);
    
    if (challenge.startDate) {
      form.setValue("startDate", new Date(challenge.startDate));
    }
    
    if (challenge.endDate) {
      form.setValue("endDate", new Date(challenge.endDate));
    }
    
    setSpecialChallengeType(challenge.challengeType);
  };
  
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
        
        {/* Challenge Title - Read-only, populated by AI */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Challenge Title</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Will be generated by AI" 
                  {...field} 
                  className={field.value ? "bg-primary/5 border-primary/20" : "text-neutral-400 italic"}
                  readOnly
                />
              </FormControl>
              <FormDescription>
                {field.value ? "Title generated by AI recovery specialist" : "Generate a challenge to see the title"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Challenge Description - Read-only, populated by AI */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Will be generated by AI" 
                  {...field} 
                  className={field.value ? "bg-primary/5 border-primary/20" : "text-neutral-400 italic"}
                  readOnly
                  rows={3}
                />
              </FormControl>
              <FormDescription>
                {field.value ? "Description generated by AI recovery specialist" : "Generate a challenge to see the description"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* AI Challenge Generator - Central to the form */}
        <div className="border rounded-lg p-6 bg-primary/5 my-6">
          <h3 className="text-lg font-medium mb-2 text-center">Generate an AI Recovery Challenge</h3>
          <p className="text-sm text-center mb-4 text-neutral-600">
            Our AI will create personalized alcohol recovery challenges based on your match.
          </p>
          
          <div className="flex justify-center mb-4">
            {form.getValues("matchId") && (
              <AIChallengeGenerator 
                matchId={form.getValues("matchId")} 
                onChallengeSelected={handleAIChallengeSelect} 
              />
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center text-xs">
            <div className="border rounded p-2 bg-white">
              <div className="font-medium text-primary mb-1">Sobriety Tracking</div>
              <div>Track days without alcohol and celebrate milestones</div>
            </div>
            <div className="border rounded p-2 bg-white">
              <div className="font-medium text-primary mb-1">Daily Check-ins</div>
              <div>Build accountability with regular communication</div>
            </div>
            <div className="border rounded p-2 bg-white">
              <div className="font-medium text-primary mb-1">Recovery Activities</div>
              <div>Step-by-step actions to support sobriety</div>
            </div>
          </div>
        </div>
        
        {/* Challenge Type - Hidden fields for form submission */}
        <div className="hidden">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    type="hidden" 
                    {...field} 
                    value="daily"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="challengeType"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    type="hidden" 
                    {...field} 
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="totalSteps"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    type="hidden" 
                    {...field} 
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
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
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t pt-4 mt-4">
          <div className="text-sm text-neutral-500 italic">
            {form.getValues("title") ? (
              <span>Your AI-generated recovery challenge is ready to create</span>
            ) : (
              <span>Please generate a recovery challenge before continuing</span>
            )}
          </div>
          <Button 
            type="submit" 
            disabled={isSubmitting || !form.getValues("title")}
            className="bg-gradient-to-r from-primary to-primary/90 text-white"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Creating...
              </>
            ) : form.getValues("title") ? (
              "Create AI Recovery Challenge"
            ) : (
              "Generate a Challenge First"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
