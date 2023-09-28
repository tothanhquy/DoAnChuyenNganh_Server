function login() {
    $.ajax({
        url: "Account/Login",
        method: "POST",
        data: {
            email: $('#floatingInputLogin').val(),
            password: $('#floatingPasswordLogin').val(),
        }
    })
    .done(function (response) {
        if (response.status == "Success") {
            window.location.assign("Admin")
        } else {
            alert(response.error);
        }
        console.log(response);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        console.log(textStatus, errorThrown);
    });
}
function logout() {
    $.ajax({
        url: "Account/Logout",
        method: "POST",
        data: {
           
        }
    })
    .done(function (response) {
        if (response.status == "Success") {
            window.location.assign("Account/Login")
        } else {
            alert(response.error);
        }
        console.log(response);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        console.log(textStatus, errorThrown);
    });
}