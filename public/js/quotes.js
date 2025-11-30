document.querySelectorAll(".delete").forEach(button => {
    button.addEventListener("click", event => {
        event.preventDefault();

        const quoteId = button.getAttribute("data-quote-id");

        document.querySelector("#quoteId").value = quoteId;

        document.querySelector("#deleteModal").showModal();
    });
});


document.querySelector("#cancel").addEventListener("click", () => {
    event.preventDefault(); 
    document.querySelector("#deleteModal").close();
});