import { v4 as uuidv4 } from 'uuid';

let editor = $state({
  items: [],
});

let maximized = $state(null);

export const reply_editors = $state({});


export function createEditorStore() {

  function newEditor(){

    if(editor.items.length == 4) {
      return
    }

    let id = uuidv4();
    editor.items.unshift({
      id: id,
      state: null
    });
  }

  function killEditor(id){
    let index = editor.items.findIndex((i) => i.id === id);
    editor.items.splice(index, 1)
    if(editor.items.length == 0) {
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

    newEditor,
    killEditor,
    maximizeEditor,
  };
}
