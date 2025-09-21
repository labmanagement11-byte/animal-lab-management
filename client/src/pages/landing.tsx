import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Lab Animal Management</h1>
            <p className="text-muted-foreground">Sign in to your account</p>
          </div>
          <div className="space-y-4">
            <Button
              onClick={() => window.location.href = "/api/login"}
              className="w-full"
              data-testid="button-login"
            >
              Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
