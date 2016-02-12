// GETS OBJ AND ONPREM FILES
function listFiles(relurlpath, relurlpathonprem){

    xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", relurlpath, false);
    xmlhttp.send();
    // Parse the list
    xmlDoc = xmlhttp.responseText;
    obj = JSON.parse(xmlDoc);

    files = document.getElementById('files');

    // Create hyperlinks to the files and display in browser
    for (num = 0; num < obj.length; num = num + 1) {
        name = obj[num].name;
        link = document.createElement('tr');
        link.className = "objFile";
        col1 = document.createElement('td');
        col1.textContent = name;
        col1.id = name;
        col1.className = "objName";
        link.appendChild(col1);
        col2 = document.createElement('td');
        col2.textContent = "Object Storage";
        link.appendChild(col2);
        col3 = document.createElement('td');
        col3.className = "delBox";
        delImg = document.createElement('img');
        delImg.src = "/images/DeleteButton.png";
        col3.appendChild(delImg);
        link.appendChild(col3);
        files.appendChild(link);
    }

    // Send a GET request to get list of all the files
    xmlhttponprem = new XMLHttpRequest();
    xmlhttponprem.open("GET", relurlpathonprem, false);
    xmlhttponprem.send();
    // Parse the list
    xmlDoconprem = xmlhttponprem.responseText;
    response = JSON.parse(xmlDoconprem);
    objonprem = response;


    for (num = 0; num < objonprem.length; num = num + 1) {
        name = objonprem[num].name;
        link = document.createElement('tr');
        link.className = "onPremFile";
        col1 = document.createElement('td');
        col1.textContent = name;
        col1.id = name;
        col1.className = "onPremName";
        link.appendChild(col1);
        col2 = document.createElement('td');
        col2.textContent = "On Premises";
        link.appendChild(col2);
        col3 = document.createElement('td');
        col3.className = "delBox";
        delImg = document.createElement('img');
        delImg.src = "/images/DeleteButton.png";
        col3.appendChild(delImg);
        link.appendChild(col3);
        files.appendChild(link);
    }

}
