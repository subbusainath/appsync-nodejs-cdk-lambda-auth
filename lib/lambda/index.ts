import createNote from "./layers/crudNotes/nodejs/createNote";
import updateNote from "./layers/crudNotes/nodejs/updateNote";
import deleteNote from "./layers/crudNotes/nodejs/deleteNote";
import getNoteById from "./layers/crudNotes/nodejs/getNoteById";
import listNote from "./layers/crudNotes/nodejs/listNote";
import Note from './layers/crudNotes/nodejs/Note'

type AppSyncEvent = {
    info : {
        fieldName: string
    },
    arguments: {
        noteId: string,
        note: Note
    }
}

exports.handler = async(event: AppSyncEvent) => {
    switch(event.info.fieldName){
        case "getNoteById":
            return await getNoteById(event.arguments.noteId);
        case "listNote":
            return await listNote();
        case "createNote":
            return await createNote(event.arguments.note);
        case "deleteNote":
            return await deleteNote(event.arguments.noteId)
        case "updateNote":
            return await updateNote(event.arguments.note);
        default:
            return null;
    }
}