export async function deleteAll() {
    try {
        // Get all database names
        const databases = await window.indexedDB.databases();
        
        // Create an array of promises for each database deletion
        const deletionPromises = databases.map(db => {
            return new Promise((resolve, reject) => {
                const deleteRequest = window.indexedDB.deleteDatabase(db.name);
                
                deleteRequest.onsuccess = () => {
                    console.log(`Successfully deleted database: ${db.name}`);
                    resolve();
                };
                
                deleteRequest.onerror = () => {
                    console.error(`Error deleting database: ${db.name}`);
                    reject(new Error(`Failed to delete database: ${db.name}`));
                };
                
                deleteRequest.onblocked = () => {
                    console.warn(`Database deletion blocked: ${db.name}`);
                    // You might want to notify the user to close other tabs
                };
            });
        });
        
        // Wait for all databases to be deleted
        await Promise.all(deletionPromises);
        console.log('All databases successfully deleted');
        
    } catch (error) {
        console.error('Error during database cleanup:', error);
        throw error;
    }
}
