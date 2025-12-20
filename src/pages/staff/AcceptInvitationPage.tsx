import { useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Info } from "lucide-react";
import { staffService } from "@/services";
import { useAuth } from "@/contexts";
import {
  acceptInvitationSchema,
  type AcceptInvitationFormData,
  formatTurkishPhone,
  normalizeTurkishPhoneInput,
} from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();
  const { login } = useAuth();

  const form = useForm<AcceptInvitationFormData>({
    resolver: zodResolver(acceptInvitationSchema),
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    data: invitation,
    isLoading: invitationLoading,
    isError: invitationError,
  } = useQuery({
    queryKey: ["staff-invitation", token],
    queryFn: () => staffService.getInvitationByToken(token),
    enabled: Boolean(token),
    retry: false,
  });

  const isInvalidStatus = useMemo(() => {
    if (!invitation) return false;
    return invitation.status !== "pending";
  }, [invitation]);

  const acceptMutation = useMutation({
    mutationFn: async (data: AcceptInvitationFormData) => {
      if (!invitation) return;
      await staffService.acceptInvitation(token, {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        password: data.password,
      });

      // Login immediately after acceptance to reach dashboard
      await login({ email: invitation.email, password: data.password });
    },
    onSuccess: () => {
      toast.success("Invitation accepted. Welcome aboard!");
      navigate("/staff/dashboard", { replace: true });
    },
    onError: (error: any) => {
      console.error("Invitation acceptance failed", error);
      toast.error(
        error?.response?.data?.message ||
          "Could not accept the invitation. Please try again."
      );
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Invalid link</CardTitle>
            <CardDescription>
              This invitation link is missing a token. Please check your email
              and try again.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" asChild>
              <Link to="/login">Go to login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (invitationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="flex items-center gap-3 text-gray-700">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading invitation...</span>
        </div>
      </div>
    );
  }

  if (invitationError || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Invitation issue
            </CardTitle>
            <CardDescription>
              We could not find this invitation. It may have expired or been
              revoked.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/login">Go to login</Link>
            </Button>
            <Button asChild>
              <Link to="/">Return home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isInvalidStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold">
              Invitation not available
            </CardTitle>
            <CardDescription>
              This invitation is {invitation.status}. Please request a new
              invitation from your admin.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/login">Go to login</Link>
            </Button>
            <Button asChild>
              <Link to="/">Return home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const onSubmit = form.handleSubmit((data) => {
    acceptMutation.mutate(data);
  });

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-blue-50 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
            <ShieldCheck className="h-4 w-4" />
            Secure staff onboarding
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Join {invitation.storeName || "your new workplace"}
          </h1>
          <p className="text-gray-600">
            Confirm your details to activate your staff account and access your
            dashboard.
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl font-semibold">
              Invitation for {invitation.email}
            </CardTitle>
            <CardDescription>
              Token expires on {new Date(invitation.expiresAt).toLocaleString()}
            </CardDescription>
          </CardHeader>

          <Form {...form}>
            <form onSubmit={onSubmit} noValidate>
              <CardContent className="space-y-5">
                <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-700 flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">
                      Why we need this
                    </p>
                    <p>
                      We use your name and phone to complete your staff profile
                      and the password for secure sign-in.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Jane"
                            disabled={acceptMutation.isPending}
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
                        <FormLabel>Last name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Doe"
                            disabled={acceptMutation.isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                          pattern="[0-9]*"
                          placeholder="(5XX) XXX XX XX"
                          value={formatTurkishPhone(field.value || "")}
                          disabled={acceptMutation.isPending}
                          onChange={(e) =>
                            field.onChange(
                              normalizeTurkishPhoneInput(e.target.value)
                            )
                          }
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            disabled={acceptMutation.isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm password *</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Re-enter your password"
                            disabled={acceptMutation.isPending}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full mt-5"
                  disabled={acceptMutation.isPending}
                >
                  {acceptMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Activating account...
                    </>
                  ) : (
                    "Activate and go to dashboard"
                  )}
                </Button>
                <p className="text-xs text-slate-500 text-center">
                  By continuing you agree to our terms of service and privacy
                  policy.
                </p>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
