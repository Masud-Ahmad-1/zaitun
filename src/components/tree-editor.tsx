'use client';

import { useState } from 'react';
import { Plus, Link2, Trash2, Pencil, TreePine, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppHeader } from './app-header';
import { MemberForm } from './member-form';
import { RelationshipForm } from './relationship-form';
import { TreeVisualization } from './tree-visualization';
import { useAppStore, type Person } from '@/lib/store';
import { t } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function TreeEditor() {
  const {
    locale,
    currentTree,
    persons,
    relationships,
    setView,
    deletePerson,
  } = useAppStore();
  const { toast } = useToast();

  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showRelationshipForm, setShowRelationshipForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [deletePersonId, setDeletePersonId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('members');

  const treeName = currentTree
    ? locale === 'bn' && currentTree.nameBn
      ? currentTree.nameBn
      : currentTree.name
    : '';

  const getPersonLabel = (p: Person) => {
    if (locale === 'bn' && p.nameBn) return p.nameBn;
    return p.name;
  };

  const handleDeletePerson = async () => {
    if (!deletePersonId) return;
    try {
      await deletePerson(deletePersonId);
      toast({ title: t('memberDeleted', locale) });
    } catch {
      toast({ title: t('error', locale), variant: 'destructive' });
    }
    setDeletePersonId(null);
  };

  const handleEditPerson = (person: Person) => {
    setEditingPerson(person);
    setShowMemberForm(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader
        showBack
        title={treeName}
        rightAction={
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setShowMemberForm(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('addMember', locale)}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setShowRelationshipForm(true)}
              disabled={persons.length < 2}
            >
              <Link2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('addRelationship', locale)}</span>
            </Button>
          </div>
        }
      />

      <main className="flex-1 container mx-auto px-4 py-4 max-w-7xl">
        {persons.length === 0 ? (
          <div className="text-center py-16">
            <TreePine className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-6">{t('noMembers', locale)}</p>
            <Button onClick={() => setShowMemberForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('addMember', locale)}
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="members" className="gap-1.5">
                <List className="h-3.5 w-3.5" />
                {t('treeMembers', locale)}
                <Badge variant="secondary" className="ml-1">{persons.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="tree" className="gap-1.5">
                <TreePine className="h-3.5 w-3.5" />
                {t('treeView', locale)}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {persons.map((person) => (
                  <Card key={person.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{getPersonLabel(person)}</h4>
                          {(locale === 'bn' && person.nameBn && person.nameBn !== person.name) && (
                            <p className="text-sm text-muted-foreground truncate">{person.name}</p>
                          )}
                          {locale === 'en' && person.nameBn && (
                            <p className="text-sm text-muted-foreground truncate">{person.nameBn}</p>
                          )}
                        </div>
                        <Badge
                          variant={person.gender === 'male' ? 'default' : 'secondary'}
                          className={
                            person.gender === 'male'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                          }
                        >
                          {person.gender === 'male' ? t('male', locale) : t('female', locale)}
                        </Badge>
                      </div>

                      {person.birthDate && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {t('birthDate', locale)}: {person.birthDate}
                        </p>
                      )}
                      {person.deathDate && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {t('deathDate', locale)}: {person.deathDate}
                        </p>
                      )}
                      {person.bio && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{person.bio}</p>
                      )}

                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() => handleEditPerson(person)}
                        >
                          <Pencil className="h-3 w-3" />
                          {t('edit', locale)}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                          onClick={() => setDeletePersonId(person.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                          {t('delete', locale)}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tree">
              <TreeVisualization />
            </TabsContent>
          </Tabs>
        )}
      </main>

      <footer className="border-t py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          {t('footer', locale)}
        </div>
      </footer>

      {/* Member Form Dialog */}
      <MemberForm
        open={showMemberForm}
        onOpenChange={(open) => {
          setShowMemberForm(open);
          if (!open) setEditingPerson(null);
        }}
        editPerson={editingPerson}
      />

      {/* Relationship Form Dialog */}
      <RelationshipForm
        open={showRelationshipForm}
        onOpenChange={setShowRelationshipForm}
      />

      {/* Delete Person Confirmation */}
      <AlertDialog open={!!deletePersonId} onOpenChange={() => setDeletePersonId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete', locale)}</AlertDialogTitle>
            <AlertDialogDescription>{t('deletePersonConfirm', locale)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('no', locale)}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePerson} className="bg-destructive text-white hover:bg-destructive/90">
              {t('yes', locale)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
