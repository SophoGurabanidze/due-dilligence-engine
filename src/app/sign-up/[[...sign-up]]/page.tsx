import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center py-20">
      <SignUp fallbackRedirectUrl="/" />
    </div>
  );
}
