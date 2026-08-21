import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent } from '../components/ui';
import { FileQuestion, ArrowLeft, Home, Sparkles } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-soft-lg border-neutral-200 text-center">
        <CardContent className="p-10">
          <div className="w-16 h-16 rounded-3xl bg-primary-50 text-primary-600 mx-auto flex items-center justify-center mb-5 border border-primary-100 shadow-soft-xs">
            <FileQuestion className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-primary-600">404 Error</span>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight mt-1">Page Not Found</h1>
          <p className="text-sm text-neutral-500 mt-2.5 max-w-sm mx-auto leading-relaxed">
            The page or resource you are looking for might have been moved, renamed, or does not exist on SmartServe.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="md"
              className="w-full sm:w-auto"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto"
              leftIcon={<Home className="w-4 h-4" />}
              onClick={() => navigate('/')}
            >
              Go to Dashboard
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center justify-center gap-1.5 text-xs text-neutral-400">
            <Sparkles className="w-3.5 h-3.5 text-primary-600" />
            <span>SmartServe Cloud Service Desk Platform</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
