from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from datetime import datetime
# 导入 database.py 中定义的数据库相关对象
from database import database, players
import json

@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    yield
    await database.disconnect()

app = FastAPI(lifespan=lifespan)

# 掛載 static 目錄
app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/save_score")
async def save_score(request: Request):
    try:
        # 手动解析表单数据，避免类型转换问题
        form_data = await request.form()
        name = form_data.get("name", "none")
        time_str = form_data.get("time", "0")
        score_str = form_data.get("score", "0")
        is_success_str = form_data.get("is_success", "false")

        # 类型转换
        try:
            time = float(time_str)
            score = int(score_str)
            # 特别处理布尔值，接受字符串 "true"/"false"
            is_success = is_success_str.lower() == "true"
        except (ValueError, TypeError) as e:
            print(f"类型转换错误: {e}")
            return JSONResponse(
                status_code=400,
                content={"message": f"参数类型错误: {str(e)}"}
            )

        # 获取客户端IP地址
        client_host = request.client.host
        # 获取 User-Agent
        websocket_id = request.headers.get("User-Agent", "Unknown")

        # 将时间戳转换为 datetime 对象
        game_time = datetime.fromtimestamp(time / 1000.0)

        print(f"解析后的数据: name={name}, time={time}, game_time={game_time}, score={score}, is_success={is_success}")

        # 插入数据库
        query = players.insert().values(
            name=name,
            game_time=game_time,
            score=score,
            is_success=is_success,
            ip_address=client_host,
            websocket_id=websocket_id
        )

        await database.execute(query)
        return {"message": "Score saved successfully"}

    except Exception as e:
        print(f"保存分数时出错: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"message": f"保存失败: {str(e)}"}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
