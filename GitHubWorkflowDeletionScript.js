(async function deleteAllVisibleRuns() {
    // 1. Select all deletion forms inside the dialogs
    // We look for forms inside dialogs that have the hidden _method="delete" input
    const deleteForms = Array.from(document.querySelectorAll('dialog form'))
        .filter(form => form.querySelector('input[name="_method"][value="delete"]'));

    if (deleteForms.length === 0) {
        console.log("No delete forms found on this page.");
        return;
    }

    const confirmDelete = confirm(`Found ${deleteForms.length} workflow runs. Are you sure you want to delete them?`);
    if (!confirmDelete) return;

    console.log(`Starting deletion of ${deleteForms.length} runs...`);

    // 2. Iterate through forms and send background requests
    let deletedCount = 0;

    for (const form of deleteForms) {
        const url = form.getAttribute('action');
        const token = form.querySelector('input[name="authenticity_token"]').value;
        
        // Construct form data for the POST request (mimicking DELETE)
        const formData = new URLSearchParams();
        formData.append('_method', 'delete');
        formData.append('authenticity_token', token);

        try {
            // Send request without navigating
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.ok) {
                deletedCount++;
                console.log(`[${deletedCount}/${deleteForms.length}] Deleted run: ${url.split('/').pop()}`);
                
                // Optional: Visually hide the row to indicate progress
                // The dialog ID usually matches "delete-workflow-run-ID"
                // We find the parent row by working back from the dialog
                const dialogId = form.closest('dialog').id;
                const openButton = document.querySelector(`button[data-show-dialog-id="${dialogId}"]`);
                if(openButton) {
                    const row = openButton.closest('.Box-row');
                    if(row) row.style.display = 'none';
                }
            } else {
                console.error(`Failed to delete ${url}: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Error deleting ${url}:`, error);
        }
    }

    console.log("Deletion process finished.");
    
    // 3. Reload page to reflect changes from server side
    setTimeout(() => {
        window.location.reload();
    }, 1000);

})();
