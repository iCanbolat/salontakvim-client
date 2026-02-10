/**
 * Register Page
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts";
import {
  registerSchema,
  type RegisterFormData,
  formatTurkishPhone,
  normalizeTurkishPhoneInput,
} from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import "@/App.css";

export function RegisterPage() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isLoading, setIsLoading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onSubmit",
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      storeName: "",
      storeSlug: "",
      password: "",
      confirmPassword: "",
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

  const nextStep = async () => {
    const fieldsToValidate: (keyof RegisterFormData)[] = [
      "storeName",
      "storeSlug",
    ];

    if (form.getValues("createStaffProfile")) {
      fieldsToValidate.push("staffTitle");
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setDirection("forward");
      setStep(2);
    }
  };

  const prevStep = () => {
    setDirection("backward");
    setStep(1);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      toast.success("Registration successful! Welcome to SalonTakvim.");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage = error?.response?.data?.message || "";

      if (errorMessage.includes("slug")) {
        form.setError("storeSlug", {
          type: "manual",
          message: "This URL is already taken. Please choose another one.",
        });
        setStep(1); // Go back to step 1 where the slug field is
        setTimeout(() => form.setFocus("storeSlug"), 0);
        toast.error("This URL is already taken.");
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Create an account
          </CardTitle>
          <CardDescription className="text-center">
            Enter your information to get started
          </CardDescription>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-center p-2 mt-4 space-x-4">
            <div className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold transition-colors duration-200",
                  step === 1
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-green-500 border-green-500 text-white",
                )}
              >
                {step > 1 ? "✓" : "1"}
              </div>
              <span
                className={cn(
                  "ml-2 text-sm font-medium",
                  step === 1 ? "text-primary" : "text-green-600",
                )}
              >
                Store Details
              </span>
            </div>
            <div
              className={cn(
                "h-px w-8 bg-gray-300 transition-colors duration-200",
                step > 1 && "bg-green-500",
              )}
            />
            <div className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold transition-colors duration-200",
                  step === 2
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-white border-gray-300 text-gray-500",
                )}
              >
                2
              </div>
              <span
                className={cn(
                  "ml-2 text-sm font-medium",
                  step === 2 ? "text-primary" : "text-gray-500",
                )}
              >
                Personal Info
              </span>
            </div>
          </div>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 overflow-hidden ">
              {step === 1 && (
                <div
                  className={cn(
                    direction === "backward"
                      ? "step-enter-left"
                      : "step-enter-right",
                  )}
                >
                  {/* Store Details */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="storeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your business name"
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
                      name="storeSlug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store URL *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="my-store-name"
                              disabled={isLoading}
                              {...field}
                              onChange={(e) => {
                                setSlugEdited(true);
                                field.onChange(e);
                              }}
                              onBlur={(e) => {
                                if (!e.target.value) {
                                  setSlugEdited(false);
                                }
                                field.onBlur();
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Optional: Create staff profile for the owner */}
                  <div className="mt-4 space-y-3 rounded-lg border p-4 bg-gray-50/60">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          Add yourself as staff (optional)
                        </p>
                        <p className="text-xs text-gray-600">
                          Create a staff profile so you can be booked or
                          assigned in your own store.
                        </p>
                      </div>
                      <FormField
                        control={form.control}
                        name="createStaffProfile"
                        render={({ field }) => (
                          <FormItem className="flex flex-col items-center space-y-1">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={isLoading}
                                aria-label="Create staff profile"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {watchedCreateStaff && (
                      <div className="grid grid-cols-1 gap-4 mt-3 animate-in fade-in zoom-in-95 duration-200">
                        <FormField
                          control={form.control}
                          name="staffTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Staff Title *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. Owner / Lead Stylist"
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
                              <FormLabel>Bio (optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Short intro, specialties, languages..."
                                  rows={3}
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
                          name="staffIsVisible"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-1">
                                <FormLabel className="text-sm font-medium">
                                  Publicly visible in booking
                                </FormLabel>
                                <p className="text-xs text-gray-600">
                                  If off, you can still assign yourself
                                  internally, but customers won’t see you in the
                                  widget.
                                </p>
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
                </div>
              )}

              {step === 2 && (
                <div
                  className={cn(
                    direction === "forward"
                      ? "step-enter-right"
                      : "step-enter-left",
                    "space-y-4",
                  )}
                >
                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="name@example.com"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="John"
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
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Doe"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone *</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            inputMode="numeric"
                            placeholder="(5XX) XXX XX XX"
                            disabled={isLoading}
                            value={formatTurkishPhone(field.value || "")}
                            onChange={(e) =>
                              field.onChange(
                                normalizeTurkishPhoneInput(e.target.value),
                              )
                            }
                            onBlur={field.onBlur}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Create a strong password"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Confirm Password */}
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password *</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Re-enter your password"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 mt-5">
              {step === 1 ? (
                <Button type="button" className="w-full" onClick={nextStep}>
                  Next Step
                </Button>
              ) : (
                <div className="flex flex-col w-full gap-3">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create account"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={prevStep}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                </div>
              )}

              {step === 1 && (
                <p className="text-sm text-center text-gray-600">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              )}
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
