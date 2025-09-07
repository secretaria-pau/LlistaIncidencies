import React, { useState, useEffect } from 'react';
import { getSheetData, callGASFunction } from '../googleServices';
import { Button, Alert, AlertDescription, AlertTitle, Tabs, TabsContent, TabsList, TabsTrigger, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Checkbox } from "./ui";
import { X } from "lucide-react";

const AdminView = ({ config, classrooms, teachers, groups, chats, onUpdateConfig, loading, profile, accessToken, onSyncLists, onUpdateStudents, onUpdateTeachers, onSyncMembers }) => {
  console.log('AdminView - config prop:', config);
  const [studentsError, setStudentsError] = useState(null);
  const [activeTab, setActiveTab] = useState('groups');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [editableConfig, setEditableConfig] = useState(config || []);
  console.log('AdminView - editableConfig state (initial):', editableConfig);

  useEffect(() => {
    setEditableConfig(config);
    console.log('AdminView - editableConfig updated by useEffect:', config);
  }, [config]);

  const [students, setStudents] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const filteredClassrooms = selectedTeacher
    ? classrooms.filter(classroom => {
        return teachers.some(teacher => teacher.email === selectedTeacher && teacher.classroomName === classroom.name);
      })
    : classrooms;

  const activeClassrooms = filteredClassrooms.filter(classroom => {
    const classroomConfig = config.find(c => c[5] === classroom.id) || [];
    return classroomConfig[0] === 'TRUE';
  });

  const handleConfigChange = (value, index, field) => {
    const newConfig = [...editableConfig];
    newConfig[index][field] = value;
    setEditableConfig(newConfig);
  };

  const handleSaveChanges = () => {
    onUpdateConfig(editableConfig);
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);
    setStudentsError(null);
    try {
      const studentsData = await getSheetData('Alumnes', accessToken);
      setStudents(studentsData);
    } catch (err) {
      setStudentsError(err.message);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [accessToken]);

  const handleViewStudents = (classroom) => {
    setSelectedClassroom(classroom);
  };

  const handleCloseStudentsModal = () => {
    setSelectedClassroom(null);
  };

  const handleExportStudents = async (classroom) => { // CAMBIO: Ahora recibe 'classroom'
    const courseName = classroom.name;
    const studentsList = students.filter(student => student[0] === courseName.replace('DEL - ', '')).sort((a, b) => a[1].localeCompare(b[1]));

    // Obtenemos el nombre del grupo
    const groupName = classroom.groupName || 'N/A'; // Asumiendo que classroom.groupName existe

    // Obtenemos los nombres de los profesores para esta clase
    const teachersForClassroom = teachers.filter(teacher => teacher.classroomName === courseName);
    const teacherNames = teachersForClassroom.map(teacher => teacher.name);
    
    console.log(`[Frontend Export] Exporting for course: ${courseName}`); // LOG
    console.log(`[Frontend Export] Received studentsList length: ${studentsList ? studentsList.length : 'null/undefined'}`); // LOG
    if (studentsList && studentsList.length > 0) {
      console.log(`[Frontend Export] First student in studentsList: ${JSON.stringify(studentsList[0])}`); // LOG
    } else {
      console.log(`[Frontend Export] studentsList is empty or null.`); // LOG
    }
    console.log(`[Frontend Export] Group Name: ${groupName}`); // LOG
    console.log(`[Frontend Export] Teacher Names: ${teacherNames.join(', ')}`); // LOG
    console.log(`[Frontend Export] newOwnerEmail (profile.email): ${profile.email}`); // AÑADE ESTA LÍNEA


    try {
      const dataToExport = studentsList.map(student => [student[1], student[2]]);
      
      const response = await callGASFunction('createStudentsSheet', accessToken, {
        courseName: courseName,
        studentsData: JSON.stringify(dataToExport),
        groupName: groupName,
        teacherNames: JSON.stringify(teacherNames),
        newOwnerEmail: profile.email || '' // <--- ESTA ES LA LÍNEA CORRECTA A AÑADIR/MODIFICAR
      });
      
      if (response.success) {
        if (response.url) {
          window.open(response.url, '_blank');
          alert(`Full de càlcul creat i obert en una nova pestanya: ${response.url}`);
        } else {
          alert(response.message);
        }
      } else {
        alert(`Error: ${response.message}`);
      }
    } catch (error) {
      alert(`Error al exportar: ${error.message}`);
      console.error('Error exporting students to Sheets:', error);
    }
  };

 const classroomStudents = selectedClassroom
    ? students.filter(student => student[0] === selectedClassroom.name.replace('DEL - ', '')).sort((a, b) => a[1].localeCompare(b[1]))
    : [];

  // Add logs here to check the values that go into classroomStudents
  console.log(`[Frontend Debug] selectedClassroom.name: ${selectedClassroom ? selectedClassroom.name : 'N/A'}`); // TEMP LOG
  console.log(`[Frontend Debug] Total students loaded (from Alumnes sheet): ${students ? students.length : 'N/A'}`); // TEMP LOG
  if (students && students.length > 0) {
    console.log(`[Frontend Debug] Example student from loaded list: ${JSON.stringify(students[0])}`); // TEMP LOG
  }
  console.log(`[Frontend Debug] classroomStudents length (after filter): ${classroomStudents ? classroomStudents.length : 'N/A'}`); // TEMP LOG
  if (classroomStudents && classroomStudents.length > 0) {
    console.log(`[Frontend Debug] Example classroomStudent: ${JSON.stringify(classroomStudents[0])}`); // TEMP LOG
  }

 

  const uniqueTeachers = Array.from(new Map(teachers.map(teacher => [teacher.email, teacher])).values());
  uniqueTeachers.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <div className="mb-4 flex space-x-2">
        <Button onClick={onSyncLists} className="bg-[#288185] hover:bg-[#1e686b] text-white" disabled={loading}>
          {loading ? 'Sincronitzant...' : 'Sincronitza Llistes'}
        </Button>
        <Button onClick={onUpdateStudents} className="bg-[#288185] hover:bg-[#1e686b] text-white" disabled={loading}>
          {loading ? 'Actualitzant...' : 'Actualitza Alumnes'}
        </Button>
        <Button onClick={onUpdateTeachers} className="bg-[#288185] hover:bg-[#1e686b] text-white" disabled={loading}>
          {loading ? 'Actualitzant...' : 'Actualitza Professors'}
        </Button>
        <Button onClick={onSyncMembers} className="bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
          {loading ? 'Sincronitzant...' : 'Sincronitza Membres'}
        </Button>
      </div>

      <Tabs defaultValue="groups" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="groups">Llistat de grups</TabsTrigger>
          {profile.role === 'Direcció' && (
            <TabsTrigger value="config">Configuració</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="groups" className="mt-3">
          {studentsError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{studentsError}</AlertDescription>
            </Alert>
          )}
          {loadingStudents && <p>Carregant alumnes...</p>}
          <div className="mb-3">
            <label htmlFor="teacher-select" className="block text-sm font-medium text-gray-700 mb-1">Selecciona un professor:</label>
            <Select onValueChange={setSelectedTeacher} value={selectedTeacher}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Tots" />
              </SelectTrigger>
              <SelectContent>
                {uniqueTeachers.map((teacher, index) => (
                  <SelectItem key={index} value={teacher.email}>{teacher.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom Classroom</TableHead>
                <TableHead>Enllaços</TableHead>
                <TableHead>Alumnes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeClassrooms.map((classroom, index) => {
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{classroom.name}</TableCell>
                    <TableCell>
                      <a href={classroom.alternateLink} target="_blank" rel="noopener noreferrer" className="text-[#288185] hover:underline mr-2">Classroom</a>
                      {classroom.chatId ? (
                        <a href={`https://chat.google.com/room/${classroom.chatId.split('/').pop()}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline mr-2">Chat</a>
                      ) : (
                        <span className="mr-2 text-gray-500">N/A</span>
                      )}
                      {classroom.groupUrl ? (
                        <a href={classroom.groupUrl} target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:underline">Grup</a>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="mr-2" onClick={() => handleViewStudents(classroom)}>
                        Alumnes
                      </Button>
                      <Button size="sm" className="bg-[#288185] hover:bg-[#1e686b] text-white" onClick={() => handleExportStudents(classroom)}>
                        Exportar Alumnes
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {selectedClassroom && (
            <Dialog open={selectedClassroom !== null} onOpenChange={handleCloseStudentsModal}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Alumnes de {selectedClassroom.name}</DialogTitle>
                  <Button variant="ghost" size="icon" onClick={handleCloseStudentsModal} className="absolute right-4 top-4">
                    <X className="h-4 w-4" />
                  </Button>
                </DialogHeader>
                <div className="p-4">
                  {classroomStudents.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom Alumne</TableHead>
                          <TableHead>Email Alumne</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {classroomStudents.map((student, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{student[1]}</TableCell>
                            <TableCell>{student[2]}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p>No hi ha alumnes per a aquesta classe.</p>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseStudentsModal}>Tancar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        {activeTab === 'config' && profile.role === 'Direcció' && (
          <TabsContent value="config" className="mt-3">
            <Button onClick={handleSaveChanges} className="bg-[#288185] hover:bg-[#1e686b] text-white mb-3" disabled={loading}>
              {loading ? 'Guardant...' : 'Guardar Canvis'}
            </Button>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Actiu</TableHead>
                  <TableHead>Nom Classroom</TableHead>
                  <TableHead>Google Group associat</TableHead>
                  <TableHead>Google Chat associat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editableConfig.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Checkbox
                        checked={row[0] === 'TRUE'}
                        onCheckedChange={(checked) => handleConfigChange(checked ? 'TRUE' : 'FALSE', index, 0)}
                      />
                    </TableCell>
                    <TableCell>{row[1]}</TableCell>
                    <TableCell>
                      <Select value={row[2]} onValueChange={(value) => handleConfigChange(value, index, 2)}>
                        <SelectTrigger>
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map((group, i) => <SelectItem key={i} value={group}>{group}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select value={row[3]} onValueChange={(value) => handleConfigChange(value, index, 3)}>
                        <SelectTrigger>
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent>
                          {chats.map((chat, i) => <SelectItem key={i} value={chat.displayName}>{chat.displayName}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default AdminView;