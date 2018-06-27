angular
    .module('hiydModule', [])
    .controller('hiydCtrl', function ($scope, $http) {
        $http.get('http://localhost:8888/top').then( res => {
            console.log(res)
            renderImage(res.data)
        }).catch((er) => {
            console.log('?????Error')
            console.log(er)
        })
        document.getElementById('howisyourday').addEventListener('click', (e) => {
            let va = $('#search')[0].value;


            $http.get('http://localhost:8888/search?text=' + va).then((res) => {

                /**
                 * prepar the data
                 */
                try {
                    let data = res.data;
                    data.forEach(element => {
                        element.tracks.items.forEach((it) => { it.keyword = element.keyword })
                    });
                    render(data);
                } catch (e) {

                    // the auth token maybe expired, need login again
                    window.location.href = "http://localhost:8888"
                }
            })
        })
    }); //end of controller

/**
 * render html with given data 
 * @param {*} data 
 */
function render(data) {
    var tracksTemplate = document.getElementById('tracksTemplate').innerHTML,
        tracksTemplate = Handlebars.compile(tracksTemplate);

    $('#list').empty();
    let keywords = data.map(i => i.keyword);

    // the keywords
    let hl = keywords.map(k => {
        return `<label class="label label-warning">${k}</label>`
    }).join("")
    let keywordsContent = `
        <div>${hl}</div>
    `
    $('#list').append(keywordsContent)
    data.forEach(a => a.tracks.items.forEach(it => {
        $('#list').append(tracksTemplate(it));
    }))
}

function renderImage(da) {
    
    $('#top').html(`<img src='${da.art}'>`)
}