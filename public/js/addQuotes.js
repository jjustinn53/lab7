document.querySelector("#addQuoteForm").addEventListener('submit', validateKeyword);

function validateKeyword() {
    let keyword = document.querySelector("textarea[name='quote']").value;
    
    if(keyword.length < 5) {
        document.querySelector("#errorMessage").style.display = 'inline';
        event.preventDefault(); //prevents the submission of the form
    } else {
        document.querySelector("#errorMessage").style.display = 'none';
    }
}