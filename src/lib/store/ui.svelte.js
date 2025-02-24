let header_title = $state(null);
export function createUIStore() {

	function updateHeaderTitle(title) {
    header_title = title;
	}

	return {

		get header_title() {
			return header_title;
		},

    updateHeaderTitle
	};
}
