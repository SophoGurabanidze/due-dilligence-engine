import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center py-20">
      <SignIn fallbackRedirectUrl="/" />
    </div>
  );
}
