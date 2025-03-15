import { SvelteMap } from 'svelte/reactivity';
import { v4 as uuidv4 } from 'uuid';

interface Editor {
    id: string,
    state: any
}

interface Editors {
    editors: Editor[]
}

export let editor: Editors = $state({
    editors: []
});

type Maximized = string | null;

let maximized: Maximized = $state(null);

export let reply_editors = $state(new SvelteMap());


export function createEditorStore() {

  function create(){

    if(editor.editors.length == 4) {
      return
    }

    let id: string = uuidv4();
    editor.editors.unshift({
      id: id,
      state: null
    });
  }

  function killEditor(id: string){
    let index = editor.editors.findIndex((i) => i.id === id);
    editor.editors.splice(index, 1)
    if(editor.editors.length == 0) {
      maximized = null;
    }
  }

  function maximizeEditor(id: string){
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
