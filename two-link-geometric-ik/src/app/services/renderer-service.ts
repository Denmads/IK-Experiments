import { Service } from '@angular/core';
import { mat4, vec2 } from 'gl-matrix';

@Service()
export class RendererService {
    private links: LinkInfo[] = [
        { a: 120, theta: -90, color: '#dd8d8d' },
        { a: 100, theta: 0, color: '#86d493' }
    ];

    private armOrigin: vec2 = vec2.fromValues(480, 275);
    private linkOriginRadius: number = 8;
    private linkWidth: number = 10;

    private endEffectorPosition: vec2 = vec2.fromValues(350, 200);
    private minReach: number = this.links[0].a - this.links[1].a;
    private maxReach: number = this.links[0].a + this.links[1].a;

    private DEG2RAD = Math.PI / 180;
    private RAD2DEG = 180 / Math.PI;

    private ctx2d: CanvasRenderingContext2D | null = null;

    public setCanvasContext(ctx: CanvasRenderingContext2D) {
        this.ctx2d = ctx;
        this.updateTransforms();
        this.updateCanvas();
        this.updateEndEffectorPosition(this.endEffectorPosition);
    }

    public updateEndEffectorPosition(newPosition: vec2): void {

        let clampedPosition = this.clampEndEffectorPosition(newPosition);
        this.endEffectorPosition = clampedPosition;
        
        let elbowAngle = this.calculateElbowAngle();
        let shoulderAngle = this.calculateShoulderAngle(elbowAngle);

        this.updateLinkAngle(0, shoulderAngle * this.RAD2DEG);
        this.updateLinkAngle(1, elbowAngle * this.RAD2DEG);

        this.updateTransforms();
        this.updateCanvas();
    }

    clampEndEffectorPosition(newPosition: vec2) {
        let ex = newPosition[0] - this.armOrigin[0];
        let ey = newPosition[1] - this.armOrigin[1];

        let dSquared = (ex * ex) + (ey * ey);
        if (dSquared >= (this.minReach * this.minReach) && dSquared <= (this.maxReach * this.maxReach)) {
            return vec2.fromValues(ex, ey);
        }

        let normalizedDir = vec2.fromValues(
            ex / Math.sqrt(dSquared),
            ey / Math.sqrt(dSquared)
        );

        let clampedPosition = vec2.create()
        if (dSquared < (this.minReach * this.minReach)) {
            vec2.scale(clampedPosition, normalizedDir, this.minReach)
        }
        else {
            vec2.scale(clampedPosition, normalizedDir, this.maxReach)
        }

        return clampedPosition;
    }

    calculateShoulderAngle(elbowAngle: number) {
        let atan2End = Math.atan2(this.endEffectorPosition[1], this.endEffectorPosition[0]);

        let a0 = this.links[0].a;
        let a1 = this.links[1].a;

        let atan2Elbow = Math.atan2(
            a1 * Math.sin(elbowAngle),
            a0 + a1 * Math.cos(elbowAngle)
        );

        return atan2End - atan2Elbow;
    }

    calculateElbowAngle() {
        let ex = this.endEffectorPosition[0];
        let ey = this.endEffectorPosition[1];

        let a0 = this.links[0].a;
        let a1 = this.links[1].a;

        // Law of cosines rewritten
        let cosTheta2 = (ex * ex + ey * ey - (a0 * a0) - (a1 * a1)) / (2 * a0 * a1);
        let clampedCosTheta2 = Math.min(Math.max(-1, cosTheta2), 1);

        return Math.acos(clampedCosTheta2)
    }

    private updateLinkAngle(linkIndex: number, newAngle: number): void {
        if (linkIndex < 0 || linkIndex >= this.links.length) {
            throw new Error(`Invalid link index: ${linkIndex}`);
        }
        this.links[linkIndex].theta = newAngle;
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

        this.drawRange();

        for (let i = 0; i < this.links.length; i++) {
            this.drawLink(i);
        }
    }

    private drawRange() {
        this.ctx2d!.strokeStyle = "darkgray";
        this.ctx2d!.lineWidth = 2;
        this.ctx2d?.setLineDash([5, 5]);

        this.ctx2d!.beginPath();
        this.ctx2d!.ellipse(this.armOrigin[0], this.armOrigin[1], this.minReach, this.minReach, 0, 0, 2 * Math.PI);
        this.ctx2d!.stroke();

        this.ctx2d!.beginPath();
        this.ctx2d!.ellipse(this.armOrigin[0], this.armOrigin[1], this.maxReach, this.maxReach, 0, 0, 2 * Math.PI);
        this.ctx2d!.stroke();
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
