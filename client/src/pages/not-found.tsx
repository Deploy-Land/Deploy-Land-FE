import { Card, CardContent } from "../components/ui/card";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";

export function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600 mb-6">
            요청하신 페이지를 찾을 수 없습니다.
          </p>
          
          <Link to="/">
            <Button>홈으로 돌아가기</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
