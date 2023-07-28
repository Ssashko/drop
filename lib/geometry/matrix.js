class Matrix {
    constructor(n, m)
    {
        this.array = [];
        this.n = n;
        this.m = m;
        for(let i = 0; i < n; i++)
        {
            this.array.push([]);
            for(let j = 0; j < m; j++)
                this.array[i].push(0);
        }

    }
    static create()
    {
        return new Matrix();
    }
    static Add(m1, m2)
    {
        if(m1.n != m2.n || m1.m != m2.n)
            throw "Incompatible matrix";
        let res = Matrix3x3.create();
        for(let i = 0; i < m1.n;i++)
            for(let j = 0; j < m2.n;j++)
                res.value[i][j] = m1.value[i][j] + m2.value[i][j];
    }

    static Mult(m1, m2) 
    {
        if(typeof m2 === "number")
            [m1, m2] = [m2, m1];
        let res = null
        if(typeof m1 === "number")
        {
            res = Matrix.create(m2.n, m2.m);
            for(let i = 0; i < m2.n;i++)
                for(let j = 0; j < m2.m;j++)
                    res.value[i][j] = m1 * m2.value[i][j];
        }
        else
        {
            if(m1.m != m2.n)
                throw "Incompatible matrix";
            res = Matrix.create(m1.n, m2.m);
            for(let i = 0; i < m1.n;i++)
                for(let j = 0; j < m2.m3;j++)
                    for(let k = 0; k < m1.m;k++)
                        res.value[i][j] += m1.value[i][k] * m2.value[k][j];
        }
        return res;
    }
}

class Matrix3x3 extends Matrix {
    constructor()
    {
        super(3,3);
    }
    static createUnitary()
    {
        let result = new Matrix3x3();
        result.value[0][0] = result.value[1][1] = result.value[2][2] = 1;
    }
    static create()
    {
        return new Matrix3x3();
    }
    get value()
    {
        return this.array;
    }

    static Mult(m1, m2) 
    {
        
        if(m1 instanceof Vector3)
        {
            let v = Matrix.create(1,3);
            v.value[1][1] = m1.x;
            v.value[1][2] = m1.y;
            v.value[1][3] = m1.z;
            return Matrix.Mult(v, m2);
        }
        else if(m2 instanceof Vector3)
        {
            let v = Matrix.create(1,3);
            v.value[1][1] = m2.x;
            v.value[2][1] = m2.y;
            v.value[3][1] = m2.z;
            return Matrix.Mult(m1, v);
        }
        return Matrix.Mult(m1, m2);    
    }

    static getRotate(angle)
    {
        let m = Matrix3x3.create();
        m.value = [[Math.cos(angle), -Math.sin(angle), 0], [Math.sin(angle), Math.cos(angle), 0], [0, 0, 1]];
        return m;
    }
    static getTranslate(v)
    {
        let m = Matrix3x3.create();
        m.value = [[1, 0, v.x], [0, 1, v.y], [0, 0, 1]];
        return m;
    }
    static getScale(v) 
    {
        let m = Matrix3x3.create();
        m.value = [[v.x, 0, 0], [0, v.y, 0], [0, 0, 1]];
        return m;
    }
}