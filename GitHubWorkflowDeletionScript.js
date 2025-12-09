// Self-sustaining GitHub Actions workflow run deleter
(async function() {
    const STORAGE_KEY = 'gh_auto_delete_runs';
    
    async function deleteAllOnPage() {
        const deleteForms = Array.from(document.querySelectorAll('dialog form'))
            .filter(form => form.querySelector('input[name="_method"][value="delete"]'));

        if (deleteForms.length === 0) {
            console.log("✅ No more workflow runs to delete. All done!");
            sessionStorage.removeItem(STORAGE_KEY); // Stop the loop
            return false;
        }

        console.log(`🗑️ Found ${deleteForms.length} workflow runs. Deleting...`);

        let deletedCount = 0;
        for (const form of deleteForms) {
            const url = form.getAttribute('action');
            const token = form.querySelector('input[name="authenticity_token"]')?.value;

            if (!token) {
                console.warn(`Skipping ${url}: no token`);
                continue;
            }

            const formData = new URLSearchParams();
            formData.append('_method', 'delete');
            formData.append('authenticity_token', token);

            try {
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
                    console.log(`[${deletedCount}/${deleteForms.length}] Deleted: ${url.split('/').pop()}`);
                } else {
                    console.error(`Failed: ${response.statusText}`);
                }
            } catch (error) {
                console.error(`Error:`, error);
            }

            await new Promise(r => setTimeout(r, 150));
        }

        console.log(`✅ Page done. Reloading for next batch...`);
        return true; // More pages might exist
    }

    // Check if we're auto-running after a reload
    if (sessionStorage.getItem(STORAGE_KEY)) {
        console.log("🔄 Auto-continuing deletion...");
        const hasMore = await deleteAllOnPage();
        if (hasMore) {
            setTimeout(() => window.location.reload(), 1500);
        }
    } else {
        // First run - ask for confirmation
        const deleteForms = Array.from(document.querySelectorAll('dialog form'))
            .filter(form => form.querySelector('input[name="_method"][value="delete"]'));
        
        if (deleteForms.length === 0) {
            console.log("No workflow runs found on this page.");
            return;
        }

        if (confirm(`Delete ALL workflow runs? (Found ${deleteForms.length} on this page, will continue through all pages)`)) {
            sessionStorage.setItem(STORAGE_KEY, 'true'); // Enable auto-continue
            const hasMore = await deleteAllOnPage();
            if (hasMore) {
                setTimeout(() => window.location.reload(), 1500);
            }
        }
    }
})();
