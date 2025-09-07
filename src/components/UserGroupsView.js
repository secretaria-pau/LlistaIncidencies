import React, { useState, useEffect } from 'react';
import { getSheetData, callGASFunction } from '../googleServices';
import { Button, Alert, AlertDescription, AlertTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui";
import { X, ArrowLeft, BookOpen, MessageSquare, Users } from "lucide-react";

const UserGroupsView = ({ classrooms, teachers, profile, accessToken, onBackClick }) => {
  const [students, setStudents] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentsError, setStudentsError] = useState(null);

  const userClassrooms = classrooms.filter(classroom => {
    return teachers.some(teacher => teacher.email === profile.email && teacher.classroomName === classroom.name);
  });

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
    console.log(`[Frontend Export] newOwnerEmail (profile.email): ${profile.email}`); // LOG

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
    ? students.filter(student => student[0] === selectedClassroom.name).sort((a, b) => a[1].localeCompare(b[1]))
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

  return (
    <div className="p-4">
      <header className="flex justify-between items-center mb-6 pb-4 border-b">
          <div className="flex items-center gap-4">
            <Button onClick={onBackClick} className="bg-primary-light text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tornar
            </Button>
            <h1 className="text-2xl font-bold">Grups d'Alumnes</h1>
          </div>
          <div className="text-right">
            <div className="font-semibold">{profile.name} ({profile.role})</div>
            <div className="text-xs text-muted-foreground">{profile.email}</div>
          </div>
        </header>
      {studentsError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{studentsError}</AlertDescription>
        </Alert>
      )}
      {loadingStudents && <p>Carregant alumnes...</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom Classroom</TableHead>
            <TableHead>Enllaços</TableHead>
            <TableHead>Alumnes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {userClassrooms.map((classroom, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{classroom.name}</TableCell>
              <TableCell>
                <Button variant="link" size="sm" className="text-[#288185] hover:underline mr-2" onClick={() => window.open(classroom.alternateLink, '_blank')}>
                  <BookOpen className="h-4 w-4 mr-1" />
                  Classroom
                </Button>
                {classroom.chatId ? (
                  <Button variant="link" size="sm" className="text-green-600 hover:underline mr-2" onClick={() => window.open(`https://chat.google.com/room/${classroom.chatId.split('/').pop()}`, '_blank')}>
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Chat
                  </Button>
                ) : (
                  <span className="mr-2 text-gray-500">N/A</span>
                )}
                {classroom.groupUrl ? (
                  <Button variant="link" size="sm" className="text-yellow-600 hover:underline" onClick={() => window.open(classroom.groupUrl, '_blank')}>
                    <Users className="h-4 w-4 mr-1" />
                    Grup
                  </Button>
                ) : (
                  <span className="text-gray-500">N/A</span>
                )}
              </TableCell>
              <TableCell>
                <Button size="sm" variant="outline" className="mr-2" onClick={() => handleViewStudents(classroom)}>
                  Alumnes
                </Button>
                <Button size="sm" variant="default" onClick={() => { /* console.log("Exportar Alumnes button clicked!"); handleExportStudents(classroom);*/ }}> 
                  Exportar Alumnes
                </Button>
              </TableCell>
            </TableRow>
          ))}
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
              <Button className="bg-[#288185] hover:bg-[#1e686b] text-white" onClick={() => handleExportStudents(selectedClassroom)}>Exportar a Sheets</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UserGroupsView;