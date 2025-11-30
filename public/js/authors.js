document.querySelectorAll(".delete").forEach(button => {
    button.addEventListener("click", event => {
        event.preventDefault();

        const authorId = button.getAttribute("data-author-id");

        document.querySelector("#authorId").value = authorId;

        document.querySelector("#deleteModal").showModal();
    });
});


document.querySelector("#cancel").addEventListener("click", () => {
    event.preventDefault(); 
    document.querySelector("#deleteModal").close();
});