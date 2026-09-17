import { Service } from '@angular/core';
import { mat4, vec2 } from 'gl-matrix';

@Service()
export class RendererService {
    private links: LinkInfo[] = [
        { a: 120, theta: -90, color: '#dd8d8d' },
        { a: 100, theta: 0, color: '#86d493' },
        { a: 80, theta: 0, color: '#86b5d4' }
    ];

    private armOrigin: vec2 = vec2.fromValues(400, 450);
    private linkOriginRadius: number = 10;
    private linkWidth: number = 10;

    private DEG2RAD = Math.PI / 180;

    private ctx2d: CanvasRenderingContext2D | null = null;

    public setCanvasContext(ctx: CanvasRenderingContext2D) {
        this.ctx2d = ctx;
        this.updateTransforms();
        this.updateCanvas();
    }

    public updateLinkAngle(linkIndex: number, newAngle: number): void {
        if (linkIndex < 0 || linkIndex >= this.links.length) {
            throw new Error(`Invalid link index: ${linkIndex}`);
        }
        this.links[linkIndex].theta = newAngle;
        this.updateTransforms();
        this.updateCanvas();
    }

    private updateTransforms(): void {
        for (let i = 0; i < this.links.length; i++) {
            const link = this.links[i];

            link.transform = mat4.fromValues(
                Math.cos(link.theta * this.DEG2RAD), Math.sin(link.theta * this.DEG2RAD), 0, 0,
                -Math.sin(link.theta * this.DEG2RAD), Math.cos(link.theta * this.DEG2RAD), 0, 0,
                0, 0, 1, 0,
                link.a * Math.cos(link.theta * this.DEG2RAD), link.a * Math.sin(link.theta * this.DEG2RAD), 0, 1
            );
        }
    }

    private updateCanvas(): void {
        if (!this.ctx2d) return;
        this.ctx2d.clearRect(0, 0, this.ctx2d.canvas.width, this.ctx2d.canvas.height);

        for (let i = 0; i < this.links.length; i++) {
            this.drawLink(i);
        }
    }

    private drawLink(index: number) {
        const link = this.links[index];

        this.ctx2d!.save()
        this.ctx2d!.strokeStyle = link.color;
        this.ctx2d!.fillStyle = link.color;

        let linkPose = this.calculateLinkPose(index);
        let linkOrigin = vec2.fromValues(linkPose[12] + this.armOrigin[0], linkPose[13] + this.armOrigin[1]);
        let theta = Math.atan2(linkPose[1], linkPose[0]) * 180 / Math.PI;
        
        //vec2.clone(this.armOrigin); // replace with the actual calculation of the link origin based on the previous links' angles and lengths
        this.ctx2d!.translate(linkOrigin[0], linkOrigin[1]);
        this.ctx2d!.rotate((theta + link.theta) * this.DEG2RAD);
        
        this.ctx2d!.beginPath();
        this.ctx2d!.ellipse(0, 0, this.linkOriginRadius, this.linkOriginRadius, 0, 0, 2 * Math.PI);
        this.ctx2d!.fill();
        
        this.ctx2d!.fillRect(0, -this.linkWidth/2, link.a, this.linkWidth);

        this.ctx2d!.restore();
    }

    private calculateLinkPose(linkIndex: number): mat4 {
        let relevantLinks = this.links.slice(0, linkIndex)
        let result = mat4.create();
        for (let t of relevantLinks) {
            mat4.mul(result, result, t.transform!);
        }

        return result;
    }
}
