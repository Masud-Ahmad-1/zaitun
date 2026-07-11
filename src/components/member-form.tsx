'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore, type Person } from '@/lib/store';
import { t } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';

interface MemberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editPerson?: Person | null;
}

export function MemberForm({ open, onOpenChange, editPerson }: MemberFormProps) {
  const { locale, addPerson, updatePerson } = useAppStore();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [gender, setGender] = useState('male');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editPerson) {
      setName(editPerson.name);
      setNameBn(editPerson.nameBn || '');
      setGender(editPerson.gender);
      setBirthDate(editPerson.birthDate || '');
      setDeathDate(editPerson.deathDate || '');
      setBio(editPerson.bio || '');
    } else {
      setName('');
      setNameBn('');
      setGender('male');
      setBirthDate('');
      setDeathDate('');
      setBio('');
    }
  }, [editPerson, open]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        nameBn: nameBn.trim() || undefined,
        gender,
        birthDate: birthDate || undefined,
        deathDate: deathDate || undefined,
        bio: bio.trim() || undefined,
      };

      if (editPerson) {
        await updatePerson(editPerson.id, data);
        toast({ title: t('memberUpdated', locale) });
      } else {
        await addPerson(data);
        toast({ title: t('memberAdded', locale) });
      }
      onOpenChange(false);
    } catch {
      toast({ title: t('error', locale), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editPerson ? t('editMember', locale) : t('addMember', locale)}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <Label htmlFor="memberName">{t('nameEn', locale)}</Label>
            <Input
              id="memberName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="memberNameBn">{t('nameBn', locale)}</Label>
            <Input
              id="memberNameBn"
              value={nameBn}
              onChange={(e) => setNameBn(e.target.value)}
              placeholder="জন স্মিথ"
            />
          </div>
          <div className="space-y-2">
            <Label>{t('gender', locale)}</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t('male', locale)}</SelectItem>
                <SelectItem value="female">{t('female', locale)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthDate">{t('birthDate', locale)}</Label>
            <Input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deathDate">{t('deathDate', locale)}</Label>
            <Input
              id="deathDate"
              type="date"
              value={deathDate}
              onChange={(e) => setDeathDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">{t('bio', locale)}</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief biography..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel', locale)}
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !name.trim()}>
            {saving ? '...' : t('save', locale)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
