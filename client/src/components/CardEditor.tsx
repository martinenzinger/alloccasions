import * as React from 'react'
import { jsPDF } from 'jspdf'
import Auth from '../auth/Auth'
import { CanvasElement } from '../types/CanvasElement'

interface CardEditorProps {
  auth: Auth
}

interface CardEditorState {
  items: CanvasElement[];
  c: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  interval: number; 
  clicked: boolean;
  x: number;
  y: number;
  currentlyHeldItem: CanvasElement|null;
  edit: boolean;
}

let img: HTMLImageElement = new Image();

export class CardEditor extends React.PureComponent<CardEditorProps, CardEditorState> {

    handleCardTextChange = (evt: any) => {
        let copyItems = this.state.items;
        let selectedItem = copyItems.pop() as CanvasElement;
        selectedItem.text = evt.target.value;
        let nodes = this.getNodesForItem(selectedItem);
        selectedItem.nodes = nodes;
        copyItems.push(selectedItem);
        this.setState({
          items: copyItems
        });
      }

    isPointBelowLine (mouseX: number, mouseY: number, prime: [number, number], center: [number, number]) {
        var dx = prime[0] - center[0];
        var dy = prime[1] - center[1];
        var mx = mouseX - center[0];
        var my = mouseY - center[1];
        var cross = dx * my - dy * mx;  //zero means point on line
        var below = (cross > 0);        //mouse is "at the right hand" of the directed line   
        if (dx != 0) {          // check for vertical line
        if (dy/dx < 0) {
            return !below;     //negative slope, invert result
        } else {
            return below;
        }     
        }
    }

    getNodesForItem (item: CanvasElement) {
        var textHeight = item.size * 0.9;
        var text = document.createElement("div");
        text.style.fontFamily = "Dancing Script"; 
        text.style.height = 'auto'; 
        text.style.width = 'auto'; 
        text.style.position = 'absolute'; 
        text.style.whiteSpace = 'no-wrap'; 
        text.style.padding = '0';
        text.innerHTML = item.text; 
        text.style.fontSize = item.size + "px";
        text.style.left = "-50vw";
        document.body.appendChild(text);

        var dw_x = text.clientWidth * Math.cos(item.rotate);
        var dw_y = text.clientWidth * Math.sin(item.rotate);

        var dh_x = text.clientHeight * Math.cos(item.rotate - Math.PI/2);
        var dh_y = text.clientHeight * Math.sin(item.rotate - Math.PI/2);

        var x_0 = item.x - textHeight * Math.sin(item.rotate);
        var y_0 = item.y - textHeight * Math.cos(item.rotate);

        document.body.removeChild(text);

        return {
            "ul": [x_0 , y_0] as [number, number],
            "ur": [(x_0 + dw_x), (y_0 - dw_y)] as [number, number],
            "ll": [(x_0 + dh_x), (y_0 - dh_y)] as [number, number],
            "lr": [(x_0 + dw_x + dh_x), (y_0 - dw_y - dh_y)] as [number, number]
         };
    }

    async selectImageFromDisk() {
        console.log("select image");
        var fileinput = document.getElementById("finput") as HTMLInputElement;    
        if (FileReader && fileinput && fileinput.files) {
            console.log("read file");
            const file = fileinput.files.item(0) as File;
            let newImage = new Image();
            newImage.crossOrigin = "anonymous";
            newImage.src = await new Promise((resolve, reject) => {
                var fr = new FileReader();  
                fr.onload = () => {
                  resolve(fr.result as string)
                };
                fr.readAsDataURL(file);
              });
            img = newImage;
        }
    }

    findTopItem (x: number, y: number): CanvasElement {
        return this.state.items.filter(item => this.isInBounds(x, y, item)).pop() as CanvasElement;
    }

    isInBounds (x: number, y: number, item: CanvasElement) {

        const nodes = item.nodes;

        item.rotate = Math.abs(item.rotate) % (2 * Math.PI);

        window.console.log("rotation " + (item.rotate / Math.PI) + " pi");

        if (item.rotate == 0) {
            return y > nodes.ul[1] && y < nodes.ll[1] && x > nodes.ul[0] && x < nodes.ur[0];
        } else if (item.rotate > 0 && item.rotate < Math.PI/2) {
            return !this.isPointBelowLine(x, y, nodes.ur, nodes.ul) && !this.isPointBelowLine(x, y, nodes.ur, nodes.lr)
                && this.isPointBelowLine(x, y, nodes.ul, nodes.ll) && this.isPointBelowLine(x, y, nodes.lr, nodes.ll);
        } else if (item.rotate === Math.PI/2) {
            return y < nodes.ul[1] && y > nodes.ur[1] && x > nodes.ul[0] && x < nodes.ll[0];
        } else if (item.rotate > Math.PI/2 && item.rotate < Math.PI) {
            return !this.isPointBelowLine(x, y, nodes.lr, nodes.ur) && !this.isPointBelowLine(x, y, nodes.lr, nodes.ll)
                && this.isPointBelowLine(x, y, nodes.ur, nodes.ul) && this.isPointBelowLine(x, y, nodes.ll, nodes.ul);
        } else if (item.rotate === Math.PI) {
            return y > nodes.ll[1] && y < nodes.ul[1] && x > nodes.ur[0] && x < nodes.ul[0];
        } else if (item.rotate > Math.PI && item.rotate < Math.PI * 3/2) {
            return !this.isPointBelowLine(x, y, nodes.ll, nodes.ul) && !this.isPointBelowLine(x, y, nodes.ll, nodes.lr)
                && this.isPointBelowLine(x, y, nodes.lr, nodes.ur) && this.isPointBelowLine(x, y, nodes.ul, nodes.ur);
        } else if (item.rotate === Math.PI * 3/2) {
            return y < nodes.ur[1] && y > nodes.ul[1] && x > nodes.ll[0] && x < nodes.ul[0];
        } else if (item.rotate > Math.PI * 3/2 && item.rotate < Math.PI * 2) {
            return !this.isPointBelowLine(x, y, nodes.ul, nodes.ll) && !this.isPointBelowLine(x, y, nodes.ul, nodes.ur)
                && this.isPointBelowLine(x, y, nodes.ll, nodes.lr) && this.isPointBelowLine(x, y, nodes.ur, nodes.lr);
        }
    }

    putItemOnTop (item: CanvasElement) {
        this.state.items.splice(this.state.items.indexOf(item), 1)
        this.state.items.push(item)
    }

    renderCanvas () {
        this.state.ctx.clearRect(0, 0, this.state.c.width, this.state.c.height)
        if (img) {
            this.state.ctx.drawImage(img, 0, 0);
        }
        
        this.state.items.forEach(element => {
            this.state.ctx.fillStyle = element.color;
            this.state.ctx.font = element.size + "px 'Dancing Script'";
            this.state.ctx.translate(element.x,element.y);
            this.state.ctx.rotate(-element.rotate);
            this.state.ctx.fillText(element.text, 0, 0);
            this.state.ctx.rotate(element.rotate);
            this.state.ctx.translate(-element.x,-element.y);
            this.state.ctx.setLineDash([5, 3]);/*dashes are 5px and spaces are 3px*/
            if (this.state.edit) {
                this.state.ctx.beginPath();
                this.state.ctx.moveTo(element.nodes.ul[0], element.nodes.ul[1]);
                this.state.ctx.lineTo(element.nodes.ur[0], element.nodes.ur[1]);
                this.state.ctx.lineTo(element.nodes.lr[0], element.nodes.lr[1]);
                this.state.ctx.lineTo(element.nodes.ll[0], element.nodes.ll[1]);
                this.state.ctx.lineTo(element.nodes.ul[0], element.nodes.ul[1]);
                this.state.ctx.strokeStyle = "white";
                this.state.ctx.stroke();
            }
        })
    }

    componentWillUnmount() {
        clearInterval(this.state.interval);
    }

    async componentDidMount() {
        try {

            const c = document.getElementById("card-editor") as HTMLCanvasElement
            const ctx = c.getContext("2d") as CanvasRenderingContext2D;
                        
            img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = 'https://source.unsplash.com/featured/900x680';
            
            let textElement = {
                    x: 360,
                    y: 250,
                    color: "#efefef",
                    size: 80,
                    text: "Custom eCard",
                    rotate: (8 * Math.PI / 180),
                    nodes: {
                        ul: [0,0] as [number,number],
                        ur: [0,0] as [number,number],
                        ll: [0,0] as [number,number],
                        lr: [0,0] as [number,number]
                    }
                };

            let nodes = this.getNodesForItem(textElement);
            textElement.nodes = nodes;

            this.setState({
                items: [textElement],
                clicked : false,
                x : 0,
                y : 0,
                currentlyHeldItem : null,
                edit: true
            });
            
            // const button1 = document.querySelector("#o1 button") as HTMLButtonElement;
            // button1.addEventListener('click', function() {
            //     try {
            //         const dataUrl = c.toDataURL();
            //         document.querySelector("#o1").innerHTML = dataUrl;
            //     } catch (e) {
            //         console.log("error: "+e);
            //         document.querySelector("#o1").innerHTML = e.toString();
            //     }
            // });
            
            const button2 = document.querySelector("#o2 button") as HTMLButtonElement;
            button2.addEventListener('click', function() {
                try {
                    const dataUrl = c.toDataURL();
                    const blobBin = atob(dataUrl.split(",")[1]);
                    let array = [];
                    for (var i = 0; i < blobBin.length; i++) {
                        array.push(blobBin.charCodeAt(i));
                    }
                    var file = new Blob([new Uint8Array(array)], { type: "image/png" });
                    var url = window.URL.createObjectURL(file);
                    window.open(url);
                } catch (e) {
                    console.log("error: "+e);
                }
            });
            
            const button3 = document.querySelector("#o3 button") as HTMLButtonElement;
            button3.addEventListener('click', function() {
                try {
                    const doc = new jsPDF({
                        orientation: "landscape",
                        unit: "px",
                        format: [900, 640]
                    });
                    var dataUrl = c.toDataURL("image/jpeg", 1.0);
                    doc.addImage(dataUrl, 'JPEG', 0, 0, 900, 640);
                    var url = window.URL.createObjectURL(doc.output('blob'));
                    window.open(url);
                } catch (e) {
                    console.log("error: "+e);
                }
            });

            const finput = document.querySelector("#finput") as HTMLInputElement;
            finput.addEventListener('change', this.selectImageFromDisk);

            c.addEventListener('mousedown', ({offsetX, offsetY}) => {
                window.console.log("mousedown", {offsetX, offsetY});
                this.setState({
                    clicked: true
                });
                let item = this.findTopItem(offsetX, offsetY); 
                if (item) {
                    this.putItemOnTop(item)
                    this.setState({
                        currentlyHeldItem: item
                    });
                }
            })
            
            c.addEventListener('mouseup', _ => {
                if (this.state.clicked && this.state.currentlyHeldItem) {
                    let copy = this.state.currentlyHeldItem;
                    copy.nodes = this.getNodesForItem(copy);
                    this.setState({
                        currentlyHeldItem: copy
                    });
                }
                this.setState({
                    clicked: false,
                    currentlyHeldItem: null
                });
            })
            
            c.addEventListener('mousemove', (evt) => {    
                var offsetX = evt.offsetX;
                var offsetY = evt.offsetY;
                if (evt.shiftKey) {
                    if (this.state.clicked && this.state.currentlyHeldItem) {
                        let copy = this.state.currentlyHeldItem;
                        copy.rotate = ((offsetY - 450 - (copy.y - 450)) / 250 * Math.PI) % (2 * Math.PI);
                        copy.nodes = this.getNodesForItem(copy);
                        this.setState({
                            currentlyHeldItem: copy
                        });
                    }
                } else {
                    let copy = this.state.currentlyHeldItem as CanvasElement;                
                    if (this.state.clicked && this.state.currentlyHeldItem) {
                        copy.x += offsetX - this.state.x
                        copy.y += offsetY - this.state.y
                        const nodes = this.getNodesForItem(copy);
                        copy.nodes = nodes;
                    }
                    this.setState({
                        x: offsetX,
                        y: offsetY,
                        currentlyHeldItem: copy
                    });
                }
            })

            const interval = setInterval(_ => this.renderCanvas(), 1000 / 60)

            setInterval(() => { console.log("items", this.state.items); }, 5000)

            this.setState({
                c: c,
                ctx: ctx,
                interval: interval
            });
        } catch (e) {
            alert(`Failed to fetch mail items: ${e.message}`)
        }
    }

    render() {
        return (
        <div className="card-editor-wrapper">
            <canvas id='card-editor' width='900' height='640'>
                <div className="transform-icon"></div>
            </canvas>
            <span id='o2'><button className="small-button">download image</button></span>
            <span id='o3'><button className="small-button">download pdf</button></span>
            <input type="file" className="small-button" accept="image/*" id="finput"></input>
            <div className="send-card-form">
                <div><label>Card Text</label><input type="text" className="" onChange={this.handleCardTextChange}/></div>
            </div>
        </div>
        )
    }
}
