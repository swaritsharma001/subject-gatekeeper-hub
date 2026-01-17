import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSubjects } from '@/hooks/useSubjects';
import { useLectures } from '@/hooks/useLectures';
import { addSubject, addLecture, deleteSubject, deleteLecture } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, BookOpen, Video, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Admin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  
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

  return (
    <div className="min-h-screen bg-background pt-20 pb-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Admin Panel</h1>
        
        <Tabs defaultValue="subjects" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="lectures">Lectures</TabsTrigger>
            <TabsTrigger value="view">View All</TabsTrigger>
          </TabsList>
          
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
