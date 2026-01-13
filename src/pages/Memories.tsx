import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Heart, PenLine, X, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAmparo } from '@/context/AmparoContext';
import type { Memory } from '@/types/amparo';
import { toast } from 'sonner';

export function Memories() {
  const { memories, addMemory, updateMemory, deleteMemory } = useAmparo();
  const [showForm, setShowForm] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memoryToDelete, setMemoryToDelete] = useState<string | null>(null);
  const [newMemory, setNewMemory] = useState({
    title: '',
    content: '',
    type: 'carta' as 'carta' | 'lembranca',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemory.title.trim() || !newMemory.content.trim()) return;

    const memory: Memory = {
      id: Date.now().toString(),
      title: newMemory.title,
      content: newMemory.content,
      date: new Date().toISOString().split('T')[0],
      type: newMemory.type,
      createdAt: new Date(),
    };
    addMemory(memory);
    setNewMemory({ title: '', content: '', type: 'carta' });
    setShowForm(false);
    toast.success('Memória guardada com sucesso');
  };

  const handleEdit = (memory: Memory) => {
    setEditingMemory(memory);
    setNewMemory({
      title: memory.title,
      content: memory.content,
      type: memory.type,
    });
    setShowForm(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemory || !newMemory.title.trim() || !newMemory.content.trim()) return;

    updateMemory(editingMemory.id, {
      title: newMemory.title,
      content: newMemory.content,
      type: newMemory.type,
    });
    
    setEditingMemory(null);
    setNewMemory({ title: '', content: '', type: 'carta' });
    setShowForm(false);
    toast.success('Memória atualizada com sucesso');
  };

  const handleDeleteClick = (memoryId: string) => {
    setMemoryToDelete(memoryId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (memoryToDelete) {
      deleteMemory(memoryToDelete);
      toast.success('Memória excluída');
      setMemoryToDelete(null);
    }
    setDeleteConfirmOpen(false);
  };

  const handleCancelForm = () => {
    setEditingMemory(null);
    setNewMemory({ title: '', content: '', type: 'carta' });
    setShowForm(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <AppLayout>
      <div className="px-4 lg:px-8 py-6 lg:py-10 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-semibold text-foreground">
              Caixa de Memórias
            </h1>
            <p className="text-muted-foreground mt-1">
              Um espaço seguro para guardar lembranças
            </p>
          </div>
        </motion.div>

        {/* Add/Edit Memory Form */}
        {(showForm || editingMemory) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card variant="serenity">
              <CardContent className="p-6">
                <form onSubmit={editingMemory ? handleUpdate : handleSubmit} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-semibold text-foreground">
                      {editingMemory ? 'Editar Memória' : 'Nova Memória'}
                    </h3>
                    <button
                      type="button"
                      onClick={handleCancelForm}
                      className="p-2 hover:bg-muted rounded-full transition-gentle"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Type selector */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewMemory({ ...newMemory, type: 'carta' })}
                      className={`flex-1 px-4 py-3 rounded-2xl text-sm font-medium transition-gentle ${
                        newMemory.type === 'carta'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      <PenLine className="w-4 h-4 inline mr-2" />
                      Escrever carta
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMemory({ ...newMemory, type: 'lembranca' })}
                      className={`flex-1 px-4 py-3 rounded-2xl text-sm font-medium transition-gentle ${
                        newMemory.type === 'lembranca'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      <Heart className="w-4 h-4 inline mr-2" />
                      Guardar lembrança
                    </button>
                  </div>

                  <input
                    type="text"
                    value={newMemory.title}
                    onChange={(e) => setNewMemory({ ...newMemory, title: e.target.value })}
                    placeholder="Título da memória"
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-gentle"
                  />

                  <textarea
                    value={newMemory.content}
                    onChange={(e) => setNewMemory({ ...newMemory, content: e.target.value })}
                    placeholder="Escreva suas palavras aqui..."
                    rows={5}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-gentle resize-none"
                  />

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={handleCancelForm}>
                      Cancelar
                    </Button>
                    <Button type="submit" variant="cta" className="flex-1">
                      {editingMemory ? 'Salvar alterações' : 'Guardar memória'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Memories Timeline */}
        <div className="space-y-4">
          {memories.map((memory, index) => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card variant="feature" className="overflow-hidden relative">
                <CardContent className="p-6">
                  {/* Menu de 3 pontinhos */}
                  <div className="absolute top-4 right-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="p-1.5 rounded-full hover:bg-muted/50 transition-gentle text-muted-foreground hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => handleEdit(memory)}
                          className="cursor-pointer"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(memory.id)}
                          className="cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-start gap-4 pr-8">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      memory.type === 'carta' ? 'bg-accent/20' : 'bg-coral/10'
                    }`}>
                      {memory.type === 'carta' ? (
                        <PenLine className="w-5 h-5 text-accent" />
                      ) : (
                        <Heart className="w-5 h-5 text-coral" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display font-semibold text-foreground">
                          {memory.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 mt-1 mb-3">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(memory.date)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {memory.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {memories.length === 0 && !showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto rounded-3xl bg-serenity-100 flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">
              Sua caixa está vazia
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Comece a guardar memórias e cartas para quem você ama.
            </p>
          </motion.div>
        )}

        {/* Floating Add Button */}
        {!showForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed bottom-24 lg:bottom-8 right-4 lg:right-8"
          >
            <Button
              variant="cta"
              size="icon-lg"
              onClick={() => setShowForm(true)}
              className="shadow-elevated"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </motion.div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir memória?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A memória será permanentemente excluída.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
