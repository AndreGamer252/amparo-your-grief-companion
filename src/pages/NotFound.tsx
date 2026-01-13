import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-warmth flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-6 max-w-md"
      >
        <div className="w-20 h-20 mx-auto rounded-3xl bg-serenity flex items-center justify-center">
          <Heart className="w-10 h-10 text-serenity-600" />
        </div>
        
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-semibold text-foreground">
            Página não encontrada
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Parece que você se perdeu no caminho. Vamos voltar para um lugar seguro?
          </p>
        </div>

        <Link to="/">
          <Button variant="cta" size="lg">
            <Home className="w-4 h-4" />
            Voltar ao início
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
