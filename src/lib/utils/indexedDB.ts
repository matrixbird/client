export async function deleteAll() {
    try {
        const databases = await window.indexedDB.databases();
        
        const deletionPromises = databases.map(db => {
            return new Promise((resolve, reject) => {
                const deleteRequest = window.indexedDB.deleteDatabase(db.name);
                
                deleteRequest.onsuccess = () => {
                    resolve();
                };
                
                deleteRequest.onerror = () => {
                    reject(new Error(`Failed to delete database: ${db.name}`));
                };
                
                deleteRequest.onblocked = () => {
                };
            });
        });
        
        await Promise.all(deletionPromises);
        
    } catch (error) {
        throw error;
    }
}
