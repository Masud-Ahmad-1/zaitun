'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, Calendar, Share2, Trash2, TreePine, Globe, Lock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AppHeader } from './app-header';
import { useAppStore } from '@/lib/store';
import { t } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function Dashboard() {
  const {
    locale,
    user,
    trees,
    fetchTrees,
    createTree,
    deleteTree,
    setView,
    setCurrentTree,
    fetchTreeData,
  } = useAppStore();
  const { toast } = useToast();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [treeName, setTreeName] = useState('');
  const [treeNameBn, setTreeNameBn] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTrees();
    }
  }, [user, fetchTrees]);

  const handleCreate = async () => {
    if (!treeName.trim()) return;
    setCreating(true);
    try {
      await createTree(treeName.trim(), treeNameBn.trim() || undefined, isPrivate);
      toast({ title: t('treeCreated', locale) });
      setShowCreateDialog(false);
      setTreeName('');
      setTreeNameBn('');
      setIsPrivate(true);
    } catch {
      toast({ title: t('error', locale), variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTree(deleteId);
      toast({ title: t('treeDeleted', locale) });
    } catch {
      toast({ title: t('error', locale), variant: 'destructive' });
    }
    setDeleteId(null);
  };

  const handleOpenTree = async (tree: typeof trees[0]) => {
    setCurrentTree(tree);
    await fetchTreeData(tree.id);
    setView('tree-editor');
  };

  const handleShare = async (tree: typeof trees[0]) => {
    try {
      const token = tree.shareToken || `zaitun_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const link = `${window.location.origin}?share=${token}`;
      await navigator.clipboard.writeText(link);
      toast({ title: t('linkCopied', locale) });
    } catch {
      toast({ title: t('error', locale), variant: 'destructive' });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader title={t('dashboard', locale)} />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t('yourTrees', locale)}</h2>
        </div>

        {trees.length === 0 ? (
          <div className="text-center py-16">
            <TreePine className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-6">{t('noTrees', locale)}</p>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('createNewTree', locale)}
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {trees.map((tree) => (
                <Card
                  key={tree.id}
                  className="group hover:shadow-md transition-shadow cursor-pointer"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleOpenTree(tree)}
                      >
                        <h3 className="font-semibold text-lg truncate">
                          {locale === 'bn' && tree.nameBn ? tree.nameBn : tree.name}
                        </h3>
                        {locale === 'bn' && tree.nameBn && tree.nameBn !== tree.name && (
                          <p className="text-sm text-muted-foreground truncate">{tree.name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        {tree.isPrivate ? (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {tree._count?.persons || 0} {t('members', locale)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(tree.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 gap-1.5"
                        onClick={() => handleOpenTree(tree)}
                      >
                        <TreePine className="h-3.5 w-3.5" />
                        {t('treeEditor', locale)}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleShare(tree)}
                        title={t('shareLink', locale)}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(tree.id)}
                        title={t('deleteTree', locale)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Create tree card */}
              <Card
                className="border-dashed hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => setShowCreateDialog(true)}
              >
                <CardContent className="p-5 flex flex-col items-center justify-center h-full min-h-[160px] text-muted-foreground hover:text-primary transition-colors">
                  <Plus className="h-8 w-8 mb-2" />
                  <span className="text-sm font-medium">{t('createNewTree', locale)}</span>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>

      <footer className="border-t py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          {t('footer', locale)}
        </div>
      </footer>

      {/* Create Tree Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('createNewTree', locale)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="treeName">{t('treeNameEn', locale)}</Label>
              <Input
                id="treeName"
                value={treeName}
                onChange={(e) => setTreeName(e.target.value)}
                placeholder="My Family Tree"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="treeNameBn">{t('treeNameBn', locale)}</Label>
              <Input
                id="treeNameBn"
                value={treeNameBn}
                onChange={(e) => setTreeNameBn(e.target.value)}
                placeholder="আমার পারিবারিক বৃক্ষ"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isPrivate">{t('private', locale)}</Label>
              <Switch
                id="isPrivate"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t('cancel', locale)}
            </Button>
            <Button onClick={handleCreate} disabled={creating || !treeName.trim()}>
              {creating ? '...' : t('save', locale)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteTree', locale)}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t('deleteTreeConfirm', locale)}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              {t('no', locale)}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('yes', locale)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
