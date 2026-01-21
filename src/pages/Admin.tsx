import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSubjects } from '@/hooks/useSubjects';
import { useLectures } from '@/hooks/useLectures';
import { 
  addSubject, 
  addLecture, 
  deleteSubject, 
  deleteLecture,
  fetchKeys,
  createKey,
  deleteKey,
  AuthKey 
} from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, BookOpen, Video, Loader2, Key, LogOut, Copy, Check, Users, KeyRound, Shield, BarChart3, Bell, Send, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ADMIN_EMAIL = 'admin@mintgram.live';
const ADMIN_PASSWORD = 'admin@mintgram.live';

const Admin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, subscribe: pushSubscribe } = usePushNotifications();
  
  // Admin auth state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Keys state
  const [keys, setKeys] = useState<AuthKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyType, setKeyType] = useState<'trial' | 'permanent'>('permanent');
  const [creatingKey, setCreatingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [keyFilter, setKeyFilter] = useState<'all' | 'used' | 'unused'>('all');
  
  // Subject form state
  const [subjectName, setSubjectName] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [addingSubject, setAddingSubject] = useState(false);
  
  // Lecture form state
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureDuration, setLectureDuration] = useState('');
  const [lectureLink, setLectureLink] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [addingLecture, setAddingLecture] = useState(false);
  
  // Push notification state
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [notificationUrl, setNotificationUrl] = useState('/');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [sendingTestPush, setSendingTestPush] = useState(false);
  
  // View lectures state
  const [viewSubjectId, setViewSubjectId] = useState('');
  const { data: lectures, isLoading: lecturesLoading } = useLectures(viewSubjectId || undefined);

  // Check admin session on mount
  useEffect(() => {
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession === 'true') {
      setIsAdminLoggedIn(true);
    }
  }, []);

  // Load keys when admin logs in
  useEffect(() => {
    if (isAdminLoggedIn) {
      loadKeys();
    }
  }, [isAdminLoggedIn]);

  const loadKeys = async () => {
    setKeysLoading(true);
    try {
      const data = await fetchKeys();
      setKeys(data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load keys', variant: 'destructive' });
    } finally {
      setKeysLoading(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail === ADMIN_EMAIL && adminPassword === ADMIN_PASSWORD) {
      setIsAdminLoggedIn(true);
      localStorage.setItem('admin_session', 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid email or password');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('admin_session');
  };

  const handleCreateKey = async () => {
    // Name is required for permanent keys
    if (keyType === 'permanent' && !keyName.trim()) {
      toast({ title: 'Error', description: 'Name is required for permanent keys', variant: 'destructive' });
      return;
    }
    
    setCreatingKey(true);
    try {
      await createKey({ type: keyType, name: keyName || undefined });
      toast({ title: 'Success', description: 'Key created successfully' });
      setKeyName('');
      setKeyType('permanent');
      loadKeys();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create key', variant: 'destructive' });
    } finally {
      setCreatingKey(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      await deleteKey(id);
      toast({ title: 'Success', description: 'Key deleted successfully' });
      loadKeys();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete key', variant: 'destructive' });
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast({ title: 'Copied!', description: 'Key copied to clipboard' });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddSubject = async () => {
    if (!subjectName.trim() || !subjectId.trim()) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    
    setAddingSubject(true);
    try {
      await addSubject({ subject: subjectName, id: subjectId });
      toast({ title: 'Success', description: 'Subject added successfully' });
      setSubjectName('');
      setSubjectId('');
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add subject', variant: 'destructive' });
    } finally {
      setAddingSubject(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      await deleteSubject(id);
      toast({ title: 'Success', description: 'Subject deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete subject', variant: 'destructive' });
    }
  };

  const handleAddLecture = async () => {
    if (!lectureTitle.trim() || !lectureDuration.trim() || !lectureLink.trim() || !selectedSubjectId) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    
    setAddingLecture(true);
    try {
      await addLecture({
        title: lectureTitle,
        duration: lectureDuration,
        subjectId: selectedSubjectId,
        link: lectureLink,
      });
      toast({ title: 'Success', description: 'Lecture added successfully' });
      setLectureTitle('');
      setLectureDuration('');
      setLectureLink('');
      setSelectedSubjectId('');
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add lecture', variant: 'destructive' });
    } finally {
      setAddingLecture(false);
    }
  };

  const handleDeleteLecture = async (id: string) => {
    try {
      await deleteLecture(id);
      toast({ title: 'Success', description: 'Lecture deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete lecture', variant: 'destructive' });
    }
  };

  const formatDuration = (seconds: string) => {
    const sec = parseInt(seconds, 10);
    if (isNaN(sec)) return seconds;
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationBody.trim()) {
      toast({ title: 'Error', description: 'Please fill title and message', variant: 'destructive' });
      return;
    }
    
    setSendingNotification(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title: notificationTitle,
          body: notificationBody,
          url: notificationUrl || '/',
        },
      });

      if (error) throw error;

      toast({ 
        title: 'Notification Sent! 🔔', 
        description: `Sent to ${data?.sent || 0} subscribers` 
      });
      setNotificationTitle('');
      setNotificationBody('');
      setNotificationUrl('/');
    } catch (error) {
      console.error('Send notification error:', error);
      toast({ title: 'Error', description: 'Failed to send notification', variant: 'destructive' });
    } finally {
      setSendingNotification(false);
    }
  };

  const handleTestPushToDevice = async () => {
    if (!pushSupported) {
      toast({ title: 'Not supported', description: 'Push notifications are not supported in this browser', variant: 'destructive' });
      return;
    }

    setSendingTestPush(true);
    try {
      // Ensure subscription exists
      if (!pushSubscribed) {
        const ok = await pushSubscribe();
        if (!ok) {
          toast({ title: 'Subscription failed', description: 'Could not subscribe to push notifications', variant: 'destructive' });
          return;
        }
      }

      // Get current subscription endpoint
      const registration = await navigator.serviceWorker.getRegistration('/push/');
      const sub = await registration?.pushManager.getSubscription();
      if (!sub) {
        toast({ title: 'No subscription', description: 'Could not find your push subscription', variant: 'destructive' });
        return;
      }

      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title: 'Test Notification 🚀',
          body: 'If you see this, push notifications are working!',
          url: '/admin',
          endpoint: sub.endpoint, // send to this device only
        },
      });

      if (error) throw error;

      toast({ title: 'Test sent!', description: 'Check your notifications' });
    } catch (err) {
      console.error('Test push error:', err);
      toast({ title: 'Error', description: 'Failed to send test push', variant: 'destructive' });
    } finally {
      setSendingTestPush(false);
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-2">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Key className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Admin Login</CardTitle>
              <p className="text-muted-foreground">Enter your admin credentials</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
                {loginError && (
                  <p className="text-destructive text-sm text-center">{loginError}</p>
                )}
                <Button type="submit" className="w-full">
                  Login
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          <Button variant="outline" onClick={handleAdminLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
        
        <Tabs defaultValue="keys" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="keys">Keys</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="lectures">Lectures</TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Notify</span>
            </TabsTrigger>
            <TabsTrigger value="view">View</TabsTrigger>
          </TabsList>
          
          {/* Keys Tab */}
          <TabsContent value="keys">
            {/* Key Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Keys</p>
                      <p className="text-2xl font-bold text-foreground">{keys.length}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Available</p>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{keys.filter(k => !k.used).length}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <KeyRound className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 border-rose-500/20">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Used</p>
                      <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{keys.filter(k => k.used).length}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                      <Users className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Permanent</p>
                      <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{keys.filter(k => k.type === 'permanent').length}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Create New Auth Key
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder={keyType === 'permanent' ? "Name of student (required)" : "Name of student (optional)"}
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  required={keyType === 'permanent'}
                />
                <Select value={keyType} onValueChange={(v) => setKeyType(v as 'trial' | 'permanent')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">Permanent (365 days)</SelectItem>
                    <SelectItem value="trial">Trial (24 hours)</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleCreateKey} disabled={creatingKey} className="w-full">
                  {creatingKey ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create Key
                </Button>
              </CardContent>
            </Card>

            {/* Keys List with Filter Tabs */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Auth Keys Management
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={loadKeys}>
                    Refresh
                  </Button>
                </div>
                {/* Filter Tabs */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant={keyFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setKeyFilter('all')}
                    className="flex-1 sm:flex-none"
                  >
                    All ({keys.length})
                  </Button>
                  <Button
                    variant={keyFilter === 'unused' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setKeyFilter('unused')}
                    className="flex-1 sm:flex-none"
                  >
                    <span className="hidden sm:inline">Available</span>
                    <span className="sm:hidden">Free</span>
                    <Badge variant="secondary" className="ml-2 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      {keys.filter(k => !k.used).length}
                    </Badge>
                  </Button>
                  <Button
                    variant={keyFilter === 'used' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setKeyFilter('used')}
                    className="flex-1 sm:flex-none"
                  >
                    Used
                    <Badge variant="secondary" className="ml-2 bg-rose-500/20 text-rose-700 dark:text-rose-300">
                      {keys.filter(k => k.used).length}
                    </Badge>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {keysLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (() => {
                  const filteredKeys = keys.filter(key => {
                    if (keyFilter === 'used') return key.used;
                    if (keyFilter === 'unused') return !key.used;
                    return true;
                  });
                  
                  return filteredKeys.length > 0 ? (
                    <div className="space-y-3">
                      <AnimatePresence>
                        {filteredKeys.map((key) => (
                          <motion.div
                            key={key._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className={`flex items-center justify-between p-4 rounded-lg border ${
                              key.used 
                                ? 'bg-rose-500/5 border-rose-500/20' 
                                : 'bg-emerald-500/5 border-emerald-500/20'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="text-sm font-mono bg-background px-2 py-1 rounded truncate max-w-[200px] sm:max-w-none">
                                  {key.authKey}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0"
                                  onClick={() => handleCopyKey(key.authKey)}
                                >
                                  {copiedKey === key.authKey ? (
                                    <Check className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                {key.name && (
                                  <span className="text-muted-foreground">{key.name}</span>
                                )}
                                <Badge variant={key.type === 'permanent' ? 'default' : 'secondary'}>
                                  {key.type}
                                </Badge>
                                <Badge 
                                  variant="outline"
                                  className={key.used 
                                    ? 'border-rose-500/50 text-rose-600 dark:text-rose-400 bg-rose-500/10' 
                                    : 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                                  }
                                >
                                  {key.used ? '● Used' : '○ Available'}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="shrink-0 ml-2"
                              onClick={() => handleDeleteKey(key._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <KeyRound className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">
                        {keyFilter === 'used' 
                          ? 'No used keys found' 
                          : keyFilter === 'unused' 
                            ? 'No available keys found' 
                            : 'No keys found'}
                      </p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Subjects Tab */}
          <TabsContent value="subjects">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Add New Subject
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Subject Name (e.g., Physics)"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                  />
                  <Input
                    placeholder="Subject ID (e.g., physics)"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddSubject} disabled={addingSubject} className="w-full">
                  {addingSubject ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add Subject
                </Button>
              </CardContent>
            </Card>

            {/* Subjects List */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>All Subjects</CardTitle>
              </CardHeader>
              <CardContent>
                {subjectsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : subjects && subjects.length > 0 ? (
                  <div className="space-y-3">
                    {subjects.map((subject) => (
                      <div
                        key={subject._id}
                        className="flex items-center justify-between p-4 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{subject.subject}</p>
                            <p className="text-sm text-muted-foreground">ID: {subject.id}</p>
                          </div>
                          <Badge variant="secondary">{subject.totalVideos} videos</Badge>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteSubject(subject._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No subjects found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Lectures Tab */}
          <TabsContent value="lectures">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Add New Lecture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects?.map((subject) => (
                      <SelectItem key={subject._id} value={subject.id}>
                        {subject.subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Lecture Title"
                  value={lectureTitle}
                  onChange={(e) => setLectureTitle(e.target.value)}
                />
                <Input
                  placeholder="Duration in seconds (e.g., 300)"
                  value={lectureDuration}
                  onChange={(e) => setLectureDuration(e.target.value)}
                />
                <Input
                  placeholder="Video Link (YouTube or HLS)"
                  value={lectureLink}
                  onChange={(e) => setLectureLink(e.target.value)}
                />
                <Button onClick={handleAddLecture} disabled={addingLecture} className="w-full">
                  {addingLecture ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add Lecture
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* View All Tab */}
          <TabsContent value="view">
            <Card>
              <CardHeader>
                <CardTitle>View Lectures by Subject</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={viewSubjectId} onValueChange={setViewSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject to View Lectures" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects?.map((subject) => (
                      <SelectItem key={subject._id} value={subject.id}>
                        {subject.subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {viewSubjectId && (
                  <div className="mt-4">
                    {lecturesLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : lectures && lectures.length > 0 ? (
                      <div className="space-y-3">
                        {lectures.map((lecture) => (
                          <div
                            key={lecture._id}
                            className="flex items-center justify-between p-4 bg-muted rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Video className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium">{lecture.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  Duration: {formatDuration(lecture.duration)}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteLecture(lecture._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No lectures found for this subject
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Send Push Notification
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Send a notification to all students who have enabled push notifications
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    placeholder="e.g., New Lecture Available! 📚"
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Message</label>
                  <Textarea
                    placeholder="e.g., Check out the new Physics lecture on Quantum Mechanics"
                    value={notificationBody}
                    onChange={(e) => setNotificationBody(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Link (optional)</label>
                  <Input
                    placeholder="e.g., /subject/physics"
                    value={notificationUrl}
                    onChange={(e) => setNotificationUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Where should the notification take users when clicked?
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSendNotification} 
                    disabled={sendingNotification || !notificationTitle.trim() || !notificationBody.trim()}
                    className="flex-1"
                  >
                    {sendingNotification ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send to All
                  </Button>
                  <Button 
                    onClick={handleTestPushToDevice} 
                    disabled={sendingTestPush}
                    variant="outline"
                  >
                    {sendingTestPush ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Smartphone className="h-4 w-4 mr-2" />
                    )}
                    Test on This Device
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Templates */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Quick Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => {
                    setNotificationTitle('New Lecture Available! 📚');
                    setNotificationBody('A new lecture has been added. Check it out now!');
                    setNotificationUrl('/');
                  }}
                >
                  <div>
                    <p className="font-medium">New Lecture</p>
                    <p className="text-xs text-muted-foreground">Announce a new lecture</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => {
                    setNotificationTitle('Study Reminder 📖');
                    setNotificationBody("Don't forget to continue your learning journey today!");
                    setNotificationUrl('/dashboard');
                  }}
                >
                  <div>
                    <p className="font-medium">Study Reminder</p>
                    <p className="text-xs text-muted-foreground">Remind students to study</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => {
                    setNotificationTitle('Important Update! ⚡');
                    setNotificationBody('We have some important updates for you.');
                    setNotificationUrl('/');
                  }}
                >
                  <div>
                    <p className="font-medium">Important Update</p>
                    <p className="text-xs text-muted-foreground">General announcement</p>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
