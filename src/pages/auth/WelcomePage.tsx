/**
 * Welcome/Onboarding Page
 * Collects store information after Google OAuth or for users without a store
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Store, Sparkles, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts";
import { storeService, authService } from "@/services";

const welcomeSchema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  storeSlug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Slug must be lowercase alphanumeric with hyphens",
    }),
  createStaffProfile: z.boolean(),
  staffTitle: z.string().max(255).optional(),
  staffBio: z.string().max(1000).optional(),
  staffIsVisible: z.boolean(),
});

type WelcomeFormData = z.infer<typeof welcomeSchema>;

export function WelcomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const { user, refetchUser } = useAuth();
  const navigate = useNavigate();

  const form = useForm<WelcomeFormData>({
    resolver: zodResolver(welcomeSchema),
    mode: "onSubmit",
    defaultValues: {
      storeName: "",
      storeSlug: "",
      createStaffProfile: false,
      staffTitle: "",
      staffBio: "",
      staffIsVisible: true,
    },
  });

  const slugify = (input: string) =>
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-");

  const watchedStoreName = form.watch("storeName");
  const watchedCreateStaff = form.watch("createStaffProfile");

  useEffect(() => {
    if (!slugEdited) {
      form.setValue("storeSlug", slugify(watchedStoreName || ""), {
        shouldValidate: false,
        shouldDirty: !!watchedStoreName,
      });
    }
  }, [watchedStoreName, slugEdited, form]);

  const onSubmit = async (data: WelcomeFormData) => {
    setIsLoading(true);
    try {
      await storeService.createMyStore({
        name: data.storeName,
        slug: data.storeSlug,
        createStaffProfile: data.createStaffProfile,
        staffTitle: data.staffTitle,
        staffBio: data.staffBio,
        staffIsVisible: data.staffIsVisible,
      });

      // Clear onboarding flag and refetch user
      authService.clearOnboardingFlag();
      await refetchUser();

      toast.success("Store created successfully! Welcome to SalonTakvim.");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Store creation error:", error);
      const errorMessage = error?.response?.data?.message || "";

      if (errorMessage.includes("slug")) {
        form.setError("storeSlug", {
          type: "manual",
          message: "This URL is already taken. Please choose another one.",
        });
        form.setFocus("storeSlug");
        toast.error("This URL is already taken.");
      } else {
        toast.error("Failed to create store. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-blue-50 to-white px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Welcome to Clinify
            {user?.firstName ? `, ${user.firstName}!` : "!"}
          </CardTitle>
          <CardDescription>
            Let's set up your business. This will only take a minute.
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 mb-4">
              {/* Store Name */}
              <FormField
                control={form.control}
                name="storeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="My Beauty Salon"
                          disabled={isLoading}
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      The name of your business as it will appear to customers.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Store Slug */}
              <FormField
                control={form.control}
                name="storeSlug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking URL *</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0">
                          clinify.com/book/
                        </span>
                        <Input
                          placeholder="my-salon"
                          disabled={isLoading}
                          className="rounded-l-none"
                          {...field}
                          onChange={(e) => {
                            setSlugEdited(true);
                            field.onChange(e);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Your unique booking page URL. Use lowercase letters,
                      numbers, and hyphens.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Optional: Create staff profile for the owner */}
              <div className="space-y-3 rounded-lg border p-4 bg-gray-50/60">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Create a staff profile for yourself
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Enable this if you'll also be providing services
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="createStaffProfile"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {watchedCreateStaff && (
                  <div className="space-y-4 pt-3 border-t animate-in fade-in zoom-in-95 duration-200">
                    <FormField
                      control={form.control}
                      name="staffTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Title *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Owner, Senior Stylist"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="staffBio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell customers a bit about yourself..."
                              disabled={isLoading}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="staffIsVisible"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between gap-2">
                          <div>
                            <FormLabel className="text-sm">
                              Visible to customers
                            </FormLabel>
                            <FormDescription className="text-xs">
                              Show your profile on the booking widget
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isLoading}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating your store...
                  </>
                ) : (
                  <>
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
