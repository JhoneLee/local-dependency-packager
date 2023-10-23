import spawn from 'cross-spawn';
import * as child_process from 'child_process';

export default function(command:string, options?:child_process.SpawnOptions) {
    const [cmd, ...params] = command.split(' ');
    return new Promise((resolve, reject) => {
        const task = spawn(cmd, params as Array<string>, options);
        let errMsg = '';
        task.on('close', status => {
            if(status === 0) {
                return resolve(`${command} execution succeed`);
            }
            return reject(`${command} execution failed: ${errMsg}`);
        });
        task.stderr?.on('data', chunk => {
            errMsg += chunk.toString();
        });
        task.on('error', err => reject(err));
        task.stdout?.pipe(process.stdout);
        task.stderr?.pipe(process.stderr);
    })
}