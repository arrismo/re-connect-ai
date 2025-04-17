import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { LogOut, User, Shield, Bell } from "lucide-react";

// Profile update form schema
const profileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  bio: z.string().optional(),
  profilePic: z.string().optional(),
  interests: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
  experiences: z.array(z.string()).optional(),
});

// Privacy settings schema
const privacySchema = z.object({
  shareGoals: z.boolean().default(true),
  shareAchievements: z.boolean().default(true),
  allowMessaging: z.boolean().default(true),
});

// Notification settings schema
const notificationSchema = z.object({
  emailNotifications: z.boolean().default(true),
  challengeReminders: z.boolean().default(true),
  newMatchNotifications: z.boolean().default(true),
  achievementNotifications: z.boolean().default(true),
});

export default function Settings() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  
  // Get interests for selection
  const { data: interestsData } = useQuery({
    queryKey: ['/api/interests'],
  });
  
  const interests = interestsData?.interests || [];
  
  // Profile form setup
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      bio: user?.bio || "",
      profilePic: user?.profilePic || "",
      interests: user?.interests || [],
      goals: user?.goals || [],
      experiences: user?.experiences || [],
    },
  });
  
  // Privacy form setup
  const privacyForm = useForm<z.infer<typeof privacySchema>>({
    resolver: zodResolver(privacySchema),
    defaultValues: {
      shareGoals: true,
      shareAchievements: true,
      allowMessaging: true,
    },
  });
  
  // Notification form setup
  const notificationForm = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      challengeReminders: true,
      newMatchNotifications: true,
      achievementNotifications: true,
    },
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate(data);
  };
  
  const onPrivacySubmit = (data: z.infer<typeof privacySchema>) => {
    console.log("Privacy settings updated", data);
    toast({
      title: "Privacy Settings Updated",
      description: "Your privacy settings have been updated.",
      variant: "success",
    });
  };
  
  const onNotificationSubmit = (data: z.infer<typeof notificationSchema>) => {
    console.log("Notification settings updated", data);
    toast({
      title: "Notification Settings Updated",
      description: "Your notification preferences have been updated.",
      variant: "success",
    });
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                    <Avatar className="h-24 w-24">
                      {user?.profilePic ? (
                        <AvatarImage src={user.profilePic} alt={user.displayName} />
                      ) : (
                        <AvatarFallback className="bg-primary text-white text-xl">
                          {user?.displayName?.[0] || user?.username?.[0] || '?'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-medium mb-2">Profile Picture</h3>
                      <p className="text-sm text-neutral-500 mb-3">
                        Your profile picture will be visible to your matches
                      </p>
                      <FormField
                        control={profileForm.control}
                        name="profilePic"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Profile picture URL" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Display Name */}
                  <FormField
                    control={profileForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your display name" {...field} />
                        </FormControl>
                        <FormDescription>
                          This is how you'll appear to others in the community
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Bio */}
                  <FormField
                    control={profileForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us a bit about yourself" 
                            {...field} 
                            className="min-h-32"
                          />
                        </FormControl>
                        <FormDescription>
                          A brief description about yourself, your background, and what you're looking to achieve
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Interests */}
                  <div className="space-y-4">
                    <div>
                      <FormLabel className="text-base">Interests</FormLabel>
                      <FormDescription>
                        Select areas you're interested in
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {interests.map((interest: any) => (
                        <FormField
                          key={interest.id}
                          control={profileForm.control}
                          name="interests"
                          render={({ field }) => (
                            <FormItem
                              className="border rounded-lg p-3 flex items-center space-x-3"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(interest.name)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value || [], interest.name]);
                                    } else {
                                      field.onChange(
                                        field.value?.filter((i) => i !== interest.name)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="cursor-pointer text-sm font-normal">
                                {interest.name}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Privacy Settings */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Manage your privacy preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...privacyForm}>
                <form onSubmit={privacyForm.handleSubmit(onPrivacySubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={privacyForm.control}
                      name="shareGoals"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-medium">Share Goals with Matches</FormLabel>
                            <FormDescription>
                              Allow your matched partners to see your personal goals
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={privacyForm.control}
                      name="shareAchievements"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-medium">Share Achievements</FormLabel>
                            <FormDescription>
                              Allow your achievements to be visible to your matches
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={privacyForm.control}
                      name="allowMessaging"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-medium">Allow Messaging</FormLabel>
                            <FormDescription>
                              Allow matches to send you direct messages
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <Button type="submit">Save Privacy Settings</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Manage how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={notificationForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-medium">Email Notifications</FormLabel>
                            <FormDescription>
                              Receive email notifications for important updates
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="challengeReminders"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-medium">Challenge Reminders</FormLabel>
                            <FormDescription>
                              Get reminders about upcoming challenge deadlines
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="newMatchNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-medium">New Match Notifications</FormLabel>
                            <FormDescription>
                              Get notified when you receive new match requests
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="achievementNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-medium">Achievement Notifications</FormLabel>
                            <FormDescription>
                              Get notified when you earn new achievements
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <Button type="submit">Save Notification Settings</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Account Actions */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
