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
}

let img: HTMLImageElement = new Image();

export class CardEditor extends React.PureComponent<CardEditorProps, CardEditorState> {

    handleCardTextChange = (evt: any) => {
        let copyItems = this.state.items;
        let selectedItem = copyItems.pop() as CanvasElement;
        selectedItem.text = evt.target.value;
        copyItems.push(selectedItem);
        this.setState({
          items: copyItems
        });
      }

    isPointBelowLine (mouseX: number, mouseY: number, xprime: number, yprime: number, centerX: number, centerY: number) {
        var dx = xprime - centerX;
        var dy = yprime - centerY;
        var mx = mouseX - centerX;
        var my = mouseY - centerY;
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

    getBoundsForItem (item: CanvasElement) {
        var textHeight = item.size;
        var text = document.createElement("div");
        text.style.fontFamily = "Dancing Script"; 
        text.style.height = 'auto'; 
        text.style.width = 'auto'; 
        text.style.position = 'absolute'; 
        text.style.whiteSpace = 'no-wrap'; 
        text.style.padding = '0 25px';
        text.innerHTML = item.text; 
        text.style.fontSize = item.size + "px";
        text.style.left = "-50vw";
        document.body.appendChild(text);
    
        var dx = Math.cos(item.rotate) * text.clientWidth;
        var dy = Math.sin(item.rotate) * text.clientWidth;
    
        document.body.removeChild(text);
    
        return {
            "top": [item.x, (item.y - textHeight), (item.x + dx), (item.y + dy - textHeight)],
            "bottom": [item.x, item.y, (item.x + dx), (item.y + dy)],
            "left": item.x,
            "right": (item.x + dx)
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
        var bounds = this.getBoundsForItem(item);
        return this.isPointBelowLine(x, y, bounds.top[0], bounds.top[1], bounds.top[2], bounds.top[3]) &&
            !this.isPointBelowLine(x, y, bounds.bottom[0], bounds.bottom[1], bounds.bottom[2], bounds.bottom[3]) &&
            x > bounds.left && x < bounds.right;
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
            this.state.ctx.rotate(element.rotate);
            this.state.ctx.fillText(element.text, 0, 0);
            this.state.ctx.rotate(-element.rotate);
            this.state.ctx.translate(-element.x,-element.y);
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
            
            let textElement: CanvasElement = {
                    x: 160,
                    y: 500,
                    color: "#efefef",
                    size: 80,
                    text: "Custom eCard",
                    rotate: (-4 * Math.PI / 180)
                };

            this.setState({
                items: [textElement],
                clicked : false,
                x : 0,
                y : 0,
                currentlyHeldItem : null
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
                        copy.rotate = (offsetX - 450) / 450 * Math.PI;
                        this.setState({
                            currentlyHeldItem: copy
                        });
                    }
                } else {
                    let copy = this.state.currentlyHeldItem as CanvasElement;                
                    if (this.state.clicked && this.state.currentlyHeldItem) {
                        copy.x += offsetX - this.state.x
                        copy.y += offsetY - this.state.y

                    }
                    this.setState({
                        x: offsetX,
                        y: offsetY,
                        currentlyHeldItem: copy
                    });
                }
            })

            const interval = setInterval(_ => this.renderCanvas(), 1000 / 60)

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
