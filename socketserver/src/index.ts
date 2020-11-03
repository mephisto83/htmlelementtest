import * as fs from 'fs';
import webcutter from './webcutter';


(async function () {
    await webcutter.go('https://www.epicgames.com/store/en-US/');

    await webcutter.setViewPortSize(webcutter.currentPage, { width: 1000, height: 700 });


    let panelInfo = await webcutter.singlePane();
    await webcutter.startServer((io: any) => {
        setInterval(() => {
            console.log('send pange updates')
            console.log(JSON.stringify(panelInfo.panelProperties, null, 4))
            io.emit('updatePanes', panelInfo);
        }, 30000)
    });
    fs.writeFileSync('./panel-info.json', JSON.stringify(panelInfo, null, 4), 'utf-8');
})();