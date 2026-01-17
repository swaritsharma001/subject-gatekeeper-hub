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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, BookOpen, Video, Loader2, Key, LogOut, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ADMIN_EMAIL = 'admin@mintgram.live';
const ADMIN_PASSWORD = 'admin@mintgram.live';

const Admin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  
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

  // Admin Login Screen
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
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="keys">Auth Keys</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="lectures">Lectures</TabsTrigger>
            <TabsTrigger value="view">View All</TabsTrigger>
          </TabsList>
          
          {/* Keys Tab */}
          <TabsContent value="keys">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Create New Auth Key
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Name (optional - leave empty to auto-generate)"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
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

            {/* Keys List */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>All Auth Keys</span>
                  <Button variant="ghost" size="sm" onClick={loadKeys}>
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {keysLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : keys.length > 0 ? (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {keys.map((key) => (
                        <motion.div
                          key={key._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="flex items-center justify-between p-4 bg-muted rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                                {key.authKey}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCopyKey(key.authKey)}
                              >
                                {copiedKey === key.authKey ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              {key.name && (
                                <span className="text-muted-foreground">{key.name}</span>
                              )}
                              <Badge variant={key.type === 'permanent' ? 'default' : 'secondary'}>
                                {key.type}
                              </Badge>
                              <Badge variant={key.used ? 'destructive' : 'outline'}>
                                {key.used ? 'Used' : 'Available'}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteKey(key._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No keys found</p>
                )}
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
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
