"use client";

import { useGoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useState } from "react";
import { Hospital } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [loading, setLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (token) => {
      try {
        setLoading(true);

        await api.post("/auth/google", {
          accessToken: token.access_token,
        });

        await fetchMe();
        router.replace("/admin");
      } catch (err) {
        console.error(err);
        alert("Login failed or unauthorized");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-lg p-8 space-y-6">

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-gray-900 flex items-center justify-center text-white font-semibold text-lg">
              <Hospital className="text-white"/>
            </div>

            <h1 className="text-2xl font-semibold text-gray-900">
              Admin Login
            </h1>

            <p className="text-sm text-gray-500">
              Sign in to access the administration panel
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400">
                Continue with
              </span>
            </div>
          </div>

          {/* Google Login */}
          <Button
            onClick={() => login()}
            disabled={loading}
            className="w-full h-12 text-sm font-medium flex items-center justify-center gap-3"
            variant="outline"
          >
            {loading ? (
              "Signing you in…"
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 48 48"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.3 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.8 6.1C12.4 13.1 17.7 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.5 24c0-1.6-.1-2.8-.4-4.1H24v7.8h12.7c-.6 3-2.4 5.6-5.1 7.3l7.8 6.1c4.5-4.2 7.1-10.3 7.1-17.1z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.5 28.7c-1-3-1-6.3 0-9.3l-7.8-6.1C-.8 17.2-.8 30.8 2.7 36.7l7.8-6z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.8-6.1c-2.1 1.4-4.8 2.2-7.8 2.2-6.3 0-11.6-3.6-13.5-8.8l-7.8 6C6.6 42.6 14.6 48 24 48z"
                  />
                </svg>
                Sign in with Google
              </>
            )}
          </Button>

          {/* Footer */}
          <p className="text-xs text-center text-gray-400">
            Authorized personnel only
          </p>
        </div>
      </div>
    </div>
  );
}
