import { v4 as uuidv4 } from 'uuid';

export let editor = $state({
  editors: [],
});

let maximized = $state(null);

export const reply_editors = $state({});


export function createEditorStore() {

  function create(){

    if(editor.editors.length == 4) {
      return
    }

    let id = uuidv4();
    editor.editors.unshift({
      id: id,
      state: null
    });
  }

  function killEditor(id){
    let index = editor.editors.findIndex((i) => i.id === id);
    editor.editors.splice(index, 1)
    if(editor.editors.length == 0) {
      maximized = null;
    }
  }

  function maximizeEditor(id){
    maximized = id;
  }

  return {

		get editor() {
			return editor;
		},

		get maximized() {
			return maximized;
		},

    create,
    killEditor,
    maximizeEditor,
  };
}
