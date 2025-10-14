import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Lab Animal Management</h1>
            <p className="text-muted-foreground">Sign in to your account</p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => window.location.href = "/api/login"}
              className="w-full"
              data-testid="button-login"
            >
              Sign In with Replit
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Link href="/local-login">
              <Button
                variant="outline"
                className="w-full"
                data-testid="button-local-login"
              >
                Employee Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
