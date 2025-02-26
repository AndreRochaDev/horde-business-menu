{
  // Update the URL display in the alias input field
  const handleCopyAlias = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/business/${alias}`);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Rest of the file remains unchanged...
}