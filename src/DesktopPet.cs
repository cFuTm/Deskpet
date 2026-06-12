using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Windows.Forms;
using System.Runtime.InteropServices;
using System.Collections.Generic;
using System.Net;

namespace DesktopPetApp
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new PetForm());
        }
    }

    public class PetForm : Form
    {
        // ====== 窗口样式 ======
        private const int WS_EX_LAYERED = 0x80000;
        private const int WS_EX_TRANSPARENT = 0x20;
        private const int WS_EX_TOOLWINDOW = 0x80;
        private readonly Color _transparentKey = Color.FromArgb(1, 2, 3);

        [DllImport("user32.dll")]
        static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);
        [DllImport("user32.dll")]
        static extern int GetWindowLong(IntPtr hWnd, int nIndex);


        // ====== 宠物状态 ======
        private System.Windows.Forms.Timer _animTimer;      // 20fps 动画
        private System.Windows.Forms.Timer _bridgeTimer;    // 每2秒轮询桥接
        private int _animFrame = 0;
        private int _bobPhase = 0;
        private bool _blinking = false;
        private int _blinkTimer = 0;
        private bool _isSleeping = false;
        private int _idleCounter = 0;
        private bool _mouseInside = false;
        private bool _isFollowingMouse = false;
        private bool _leftMouseMoved = false;
        private Point _leftMouseDownPoint;
        private Point _followTarget;
        private Random _rng = new Random();
        
        // ====== 空闲小动作 ======
        private int _idleActionTimer = 0;
        private int _idleActionDuration = 0;
        private string _idleActionType = "";
        private bool _idleActionActive = false;
        private int _idleTimerSinceReply = 999;  // 回复后等待计数器

        // ====== 桥接同步状态 ======
        private string _petStatus = "idle";      // idle | thinking | responding | offline
        private string _petMood = "happy";        // happy | normal | surprised | sleepy | thinking
        private string _manualMood = "";
        private int _manualMoodIndex = -1;
        private string _bubbleText = "";
        private string _bubbleToken = "";
        private int _localBubbleFrames = 0;
        private bool _bridgeOnline = false;
        private string _lastReply = "";
        private string _lastReplyTime = "";
        private string _petTimestamp = "";
        private bool _voiceEnabled = true;
        private int _offlineCounter = 0;

        // ====== 皮肤系统 ======
        private Dictionary<string, List<Bitmap>> _skins = new Dictionary<string, List<Bitmap>>();
        private bool _useSkins = false;
        private string _skinDir = "";
        private readonly string[] _clickMoods = { "normal", "happy", "surprised", "sleepy", "thinking", "shy", "sad", "angry", "contempt" };

        // ====== 尺寸 ======
        private const int PET_W = 180;
        private const int PET_H = 250;
        private const int BODY_R = 46;
        private const int PET_CENTER_Y_OFFSET = 78;

        // ====== 颜色 ======
        private readonly Color _bodyColor1 = Color.FromArgb(88, 166, 255);
        private readonly Color _bodyColor2 = Color.FromArgb(56, 120, 220);
        private readonly Color _glowColor = Color.FromArgb(40, 80, 180);
        private readonly Color _eyePupil = Color.FromArgb(30, 30, 50);
        private readonly Color _accentColor = Color.FromArgb(120, 200, 255);
        private readonly Color _blushColor = Color.FromArgb(255, 150, 150);

        // ====== 桥接 API ======
        private const string BRIDGE_URL = "http://localhost:9101";
        private WebClient _web;

        public PetForm()
        {
            _web = new WebClient();
            _web.Encoding = System.Text.Encoding.UTF8;
            // WebClient 默认100秒超时，设短一点
            _web.BaseAddress = "";  // 没用但无害

            this.FormBorderStyle = FormBorderStyle.None;
            this.ShowInTaskbar = false;
            this.TopMost = true;
            this.Width = PET_W;
            this.Height = PET_H;
            this.StartPosition = FormStartPosition.Manual;
            this.BackColor = _transparentKey;
            this.TransparencyKey = _transparentKey;
            this.Opacity = 0.92;

            var screen = Screen.PrimaryScreen.WorkingArea;
            this.Location = new Point(screen.Right - PET_W - 20, screen.Bottom - PET_H - 30);

            // 分层窗口
            int exStyle = GetWindowLong(this.Handle, -20);
            SetWindowLong(this.Handle, -20, exStyle | WS_EX_LAYERED | WS_EX_TOOLWINDOW);

            this.SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.UserPaint | ControlStyles.DoubleBuffer | ControlStyles.ResizeRedraw, true);
            this.UpdateStyles();

            // 20fps 动画
            _animTimer = new System.Windows.Forms.Timer { Interval = 50 };
            _animTimer.Tick += OnAnimTick;
            _animTimer.Start();

            // 每0.5秒轮询桥接服务
            _bridgeTimer = new System.Windows.Forms.Timer { Interval = 500 };
            _bridgeTimer.Tick += (s, e) => PollBridge();
            _bridgeTimer.Start();

            // 鼠标事件
            this.MouseEnter += (s, e) => { _mouseInside = true; _isSleeping = false; _idleCounter = 0; };
            this.MouseLeave += (s, e) => { _mouseInside = false; };
            this.MouseDown += OnPetClick;
            this.MouseMove += OnPetDrag;
            this.MouseUp += OnPetMouseUp;

            this.Paint += OnPetPaint;

            // 启动后立即查一次
            this.Shown += (s, e) => { PollBridge(); this.Invalidate(); };

            // 加载皮肤
            LoadSkins();
        }

        // ====== 轮询桥接 ======
        private void PollBridge()
        {
            try
            {
                string json = _web.DownloadString(BRIDGE_URL + "/status");
                var state = JsonParse(json);
                if (state != null)
                {
                    _bridgeOnline = true;
                    _offlineCounter = 0;

                    _petStatus = GetString(state, "status");
                    _petMood = NormalizeMood(GetString(state, "mood"));

                    string newBubble = GetString(state, "bubble");
                    string newBubbleToken = GetString(state, "bubble_token");
                    if (newBubbleToken != _bubbleToken)
                    {
                        _bubbleToken = newBubbleToken;
                        // 随文字变宽，最大支持约100字
                        _bubbleText = newBubble.Length > 100
                            ? newBubble.Substring(0, 98) + "…"
                            : newBubble;
                        _localBubbleFrames = 0;
                    }

                    _lastReply = GetString(state, "last_reply");
                    _lastReplyTime = GetString(state, "last_reply_time");
                    _petTimestamp = GetString(state, "timestamp");
                    _voiceEnabled = GetBool(state, "voice_enabled", _voiceEnabled);

                    // 根据桥接状态更新表情
                    UpdateExpression();
                    this.Invalidate();
                }
            }
            catch
            {
                _offlineCounter++;
                if (_offlineCounter >= 3)
                {
                    _bridgeOnline = false;
                    _petStatus = "offline";
                    if (_offlineCounter == 3)
                        ShowLocalBubble("网关连不上了...");
                    this.Invalidate();
                }
            }
        }

        private void UpdateExpression()
        {
            _isSleeping = false;
            switch (_petStatus)
            {
                case "thinking":
                    // 思考中 - 眯眼专注
                    _blinkTimer = 999; // 不眨眼
                    break;
                case "responding":
                    // 回复中 - 开心
                    break;
                case "offline":
                    _isSleeping = true;
                    break;
                default: // idle
                    if (!_mouseInside && string.IsNullOrEmpty(_bubbleText))
                    {
                        _idleCounter++;
                        if (_idleCounter > 200)
                            _isSleeping = true;
                    }
                    break;
            }
        }

        // ====== 加载皮肤 ======
        private void LoadSkins()
        {
            string baseDir = System.IO.Path.GetDirectoryName(Application.ExecutablePath);
            string userSkinDir = System.IO.Path.Combine(baseDir, "skin_src", "skin_src_resized");
            string basicSkinDir = System.IO.Path.Combine(baseDir, "basic_skin");

            _skins.Clear();
            _useSkins = false;

            bool anyBasic = LoadSkinDir(basicSkinDir, _clickMoods, false);
            bool anyUser = LoadSkinDir(userSkinDir, _clickMoods, true);

            _skinDir = anyUser ? userSkinDir : basicSkinDir;
            _useSkins = anyBasic || anyUser;
        }

        private bool LoadSkinDir(string dir, string[] names, bool overwrite)
        {
            if (!System.IO.Directory.Exists(dir)) return false;

            bool any = false;
            foreach (string n in names)
            {
                if (!overwrite && _skins.ContainsKey(n))
                    continue;

                string path = System.IO.Path.Combine(dir, n + ".png");
                if (System.IO.File.Exists(path))
                {
                    try
                    {
                        _skins[n] = new List<Bitmap> { (Bitmap)Image.FromFile(path) };
                        any = true;
                    }
                    catch { }
                }

                string frameDir = System.IO.Path.Combine(dir, n);
                if (System.IO.Directory.Exists(frameDir))
                {
                    var frames = LoadSkinFrames(frameDir);
                    if (frames.Count > 0)
                    {
                        _skins[n] = frames;
                        any = true;
                    }
                }
            }
            return any;
        }

        private List<Bitmap> LoadSkinFrames(string frameDir)
        {
            var frames = new List<Bitmap>();
            try
            {
                string[] files = System.IO.Directory.GetFiles(frameDir, "*.png");
                Array.Sort(files, StringComparer.OrdinalIgnoreCase);
                foreach (string file in files)
                    frames.Add((Bitmap)Image.FromFile(file));
            }
            catch { }
            return frames;
        }

        // ====== 简易 JSON 解析（C# 5 兼容） ======
        private string GetString(Dictionary<string, object> dict, string key)
        {
            if (dict == null) return "";
            object val;
            if (dict.TryGetValue(key, out val) && val != null)
                return val.ToString();
            return "";
        }

        private bool GetBool(Dictionary<string, object> dict, string key, bool fallback)
        {
            string val = GetString(dict, key).ToLowerInvariant();
            if (val == "true") return true;
            if (val == "false") return false;
            return fallback;
        }

        private string NormalizeMood(string mood)
        {
            if (string.IsNullOrEmpty(mood)) return "normal";
            mood = mood.ToLowerInvariant();
            if (mood == "basic" || mood == "idle") return "normal";
            if (mood == "responding") return "happy";

            string[] valid = { "normal", "happy", "surprised", "sleepy", "thinking", "shy", "sad", "angry", "contempt" };
            foreach (string item in valid)
            {
                if (mood == item)
                    return mood;
            }
            return "normal";
        }

        private Dictionary<string, object> JsonParse(string json)
        {
            var result = new Dictionary<string, object>();
            json = json.Trim();
            if (!json.StartsWith("{") || !json.EndsWith("}")) return null;
            json = json.Substring(1, json.Length - 2);

            int i = 0;
            while (i < json.Length)
            {
                // Skip whitespace / commas
                while (i < json.Length && (json[i] == ' ' || json[i] == ',' || json[i] == '\n' || json[i] == '\r'))
                    i++;
                if (i >= json.Length) break;

                // Read key
                if (json[i] != '"') break;
                i++;
                string key = "";
                while (i < json.Length && json[i] != '"')
                {
                    if (json[i] == '\\') { i++; if (i < json.Length) key += json[i]; }
                    else key += json[i];
                    i++;
                }
                i++; // skip closing "

                // Skip :
                while (i < json.Length && json[i] != ':') i++;
                i++;
                while (i < json.Length && json[i] == ' ') i++;

                // Read value
                if (i < json.Length && json[i] == '"')
                {
                    i++;
                    string val = "";
                    while (i < json.Length && json[i] != '"')
                    {
                        if (json[i] == '\\') { i++; if (i < json.Length) val += json[i]; }
                        else val += json[i];
                        i++;
                    }
                    i++;
                    result[key] = val;
                }
                else if (i < json.Length && (json[i] == 't' || json[i] == 'f'))
                {
                    if (json.Substring(i).StartsWith("true")) { result[key] = "true"; i += 4; }
                    else { result[key] = "false"; i += 5; }
                }
                else if (i < json.Length && json[i] == '{')
                {
                    int depth = 1; i++;
                    string sub = "{";
                    while (i < json.Length && depth > 0)
                    {
                        if (json[i] == '{') depth++;
                        else if (json[i] == '}') depth--;
                        sub += json[i];
                        i++;
                    }
                    result[key] = sub;
                }
            }
            return result;
        }

        // ====== 动画循环 ======
        private void OnAnimTick(object sender, EventArgs e)
        {
            _animFrame++;
            _bobPhase = (_bobPhase + 1) % 20;

            // 眨眼控制
            _blinkTimer++;
            if (!_petStatus.Equals("thinking") && _blinkTimer > _rng.Next(80, 200))
            {
                _blinking = true;
                _blinkTimer = 0;
            }
            if (_blinking && _blinkTimer > 4) _blinking = false;

            if (_localBubbleFrames > 0)
            {
                _localBubbleFrames--;
                if (_localBubbleFrames == 0)
                    _bubbleText = "";
            }

            // 聊天时的等待计数器
            if (_petStatus == "responding" && !string.IsNullOrEmpty(_bubbleText))
                _idleTimerSinceReply++;
            else if (_petStatus == "thinking" || _petStatus == "idle")
                _idleTimerSinceReply = 0;

            // 空闲小动作：发呆或回复完等一会儿，随机切换表情
            bool canIdleAction = (_petStatus == "idle" && string.IsNullOrEmpty(_bubbleText) && !_mouseInside)
                || (_petStatus == "responding" && !_mouseInside && _idleTimerSinceReply > 150); // 回复完3秒后也能动
            if (canIdleAction)
            {
                if (_idleActionActive)
                {
                    _idleActionDuration--;
                    if (_idleActionDuration <= 0)
                    {
                        _idleActionActive = false;
                        _idleActionTimer = _rng.Next(150, 400); // 下次动作间隔 3-8 秒
                    }
                }
                else
                {
                    _idleActionTimer--;
                    if (_idleActionTimer <= 0)
                    {
                        // 随机选一个空闲表情
                        string[] actions = { "normal", "happy", "surprised", "sleepy", "thinking", "shy", "sad", "angry", "contempt" };
                        _idleActionType = actions[_rng.Next(actions.Length)];
                        _idleActionDuration = _rng.Next(15, 35); // 动作持续 0.3-0.7 秒
                        _idleActionActive = true;
                    }
                }
            }
            else
            {
                // 不空闲时重置小动作定时器
                _idleActionActive = false;
                _idleActionTimer = _rng.Next(200, 500);
            }

            // 鼠标跟随：实际移动窗口
            if (_isFollowingMouse)
            {
                var screen = Screen.PrimaryScreen.WorkingArea;
                int newX = _followTarget.X - PET_W / 2;
                int newY = _followTarget.Y - 25;
                newX = Math.Max(0, Math.Min(screen.Right - PET_W - 5, newX));
                newY = Math.Max(0, Math.Min(screen.Bottom - PET_H - 5, newY));
                this.Location = new Point(newX, newY);
            }

            this.Invalidate();
        }

        // ====== 绘制宠物 ======
        private void OnPetPaint(object sender, PaintEventArgs e)
        {
            DrawScene(e.Graphics);
        }

        private void DrawScene(Graphics g)
        {
            g.Clear(_transparentKey);
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;

            float bobY = (float)Math.Sin(_bobPhase * Math.PI / 10) * 2.5f;
            // 思考时轻微颤抖
            float thinkShakeX = _petStatus.Equals("thinking") ? (float)Math.Sin(_animFrame * 0.3f) * 1.5f : 0;
            float breathe = 1 + (float)Math.Sin(_animFrame * 0.05f) * 0.012f;
            if (_petStatus.Equals("thinking")) breathe = 1 + (float)Math.Sin(_animFrame * 0.12f) * 0.018f;

            g.TranslateTransform(thinkShakeX, bobY);
            g.ScaleTransform(breathe, breathe);
            g.TranslateTransform(PET_W / 2, PET_H - PET_CENTER_Y_OFFSET);

            // ---- 确定当前表情 ---- 
            string expr = _petMood;
            if (_isSleeping || _petStatus == "offline") expr = "sleepy";
            else if (_petStatus == "thinking") expr = "thinking";
            else if (!string.IsNullOrEmpty(_manualMood)) expr = _manualMood;
            else if (_idleActionActive && _petStatus == "idle") expr = _idleActionType;
            else if (string.IsNullOrEmpty(expr)) expr = "normal";

            // ---- 皮肤模式：画 PNG ---- 
            if (_useSkins && _skins.ContainsKey(expr))
            {
                var frames = _skins[expr];
                var skin = frames[Math.Abs(_animFrame / 4) % frames.Count];
                g.DrawImage(skin, -skin.Width / 2, -skin.Height / 2, skin.Width, skin.Height);
            }
            else
            {
                // ---- 代码绘制备用 ---- 
                // ---- 状态光晕 ----
            Color glow = _bridgeOnline ? _glowColor : Color.FromArgb(180, 60, 60);
            if (_petStatus.Equals("thinking")) glow = Color.FromArgb(100, 180, 255);
            if (_petStatus.Equals("responding")) glow = Color.FromArgb(80, 220, 120);

            using (var glowBrush = new SolidBrush(Color.FromArgb(20, glow)))
            {
                for (int i = 0; i < 3; i++)
                    g.FillEllipse(glowBrush, -BODY_R - 10 - i * 6, -BODY_R - 5 - i * 4,
                        (BODY_R + 12 + i * 8) * 2, (BODY_R + 8 + i * 6) * 2);
            }

            // ---- 身体 ----
            float bodyR = BODY_R * (_isSleeping ? 0.85f : 1f);
            var bodyRect = new RectangleF(-bodyR, -bodyR, bodyR * 2, bodyR * 2);
            Color c1 = _petStatus.Equals("thinking") ? Color.FromArgb(160, 200, 255) : _bodyColor1;
            Color c2 = _petStatus.Equals("thinking") ? Color.FromArgb(80, 150, 240) : _bodyColor2;
            if (!_bridgeOnline) { c1 = Color.FromArgb(140, 140, 160); c2 = Color.FromArgb(100, 100, 120); }

            using (var bodyBrush = new LinearGradientBrush(bodyRect, c1, c2, LinearGradientMode.ForwardDiagonal))
                g.FillEllipse(bodyBrush, bodyRect);

            using (var highlightBrush = new SolidBrush(Color.FromArgb(50, _accentColor)))
                g.FillEllipse(highlightBrush, -bodyR * 0.5f, -bodyR * 0.7f, bodyR * 0.9f, bodyR * 0.6f);

            // ---- 睡觉 ZZZ ----
            if (_isSleeping)
            {
                float zBase = -bodyR - 10;
                for (int i = 0; i < 3; i++)
                {
                    float zOffset = (float)Math.Sin(_animFrame * 0.08f + i * 1.5f) * 3;
                    float zSize = 7 + i * 4;
                    using (var zBrush = new SolidBrush(Color.FromArgb(150 - i * 30, Color.White)))
                        g.DrawString("z", new Font("Segoe UI", zSize * 0.6f, FontStyle.Bold), zBrush,
                            -bodyR - 8 + i * 8, zBase - i * 11 + zOffset);
                }
            }

            // ---- 眼睛 ----
            if (!_isSleeping)
            {
                float eyeY = -bodyR * 0.2f;
                float eyeSpacing = bodyR * 0.3f;
                float eyeSize = bodyR * 0.28f;
                bool closed = _blinking && _blinkTimer < 4;
                bool thinking = _petStatus.Equals("thinking");

                for (int side = -1; side <= 1; side += 2)
                {
                    float ex = side * eyeSpacing;
                    if (closed)
                    {
                        using (var closePen = new Pen(_eyePupil, 2))
                            g.DrawArc(closePen, ex - eyeSize, eyeY, eyeSize * 2, eyeSize * 1.2f, 0, 180);
                    }
                    else
                    {
                        float eyeH = thinking ? eyeSize * 0.8f : eyeSize * 1.8f;
                        using (var eyeBrush = new SolidBrush(Color.White))
                            g.FillEllipse(eyeBrush, ex - eyeSize, eyeY - eyeSize * 0.6f, eyeSize * 2, eyeH);

                        float ps = thinking ? eyeSize * 0.35f : eyeSize * 0.55f;
                        float pupilY = thinking ? eyeY - 1 : eyeY + 1;
                        using (var pupilBrush = new SolidBrush(_eyePupil))
                            g.FillEllipse(pupilBrush, ex - ps, pupilY - ps * 0.6f, ps * 2, ps * 1.8f);

                        using (var sparkleBrush = new SolidBrush(Color.FromArgb(180, Color.White)))
                            g.FillEllipse(sparkleBrush, ex - ps * 0.6f, pupilY - ps * 0.7f, ps * 0.7f, ps * 0.7f);
                    }
                }
            }
            else
            {
                float eyeY = -bodyR * 0.15f;
                for (int side = -1; side <= 1; side += 2)
                {
                    using (var sleepPen = new Pen(Color.FromArgb(180, _eyePupil), 1.8f))
                        g.DrawArc(sleepPen, side * bodyR * 0.3f - 6, eyeY - 2, 12, 8, 0, -180);
                }
            }

            // ---- 腮红 ----
            if (_petStatus.Equals("responding") || _petMood.Equals("happy") || _mouseInside)
            {
                for (int side = -1; side <= 1; side += 2)
                {
                    using (var blushBrush = new SolidBrush(Color.FromArgb(60, _blushColor)))
                        g.FillEllipse(blushBrush, side * bodyR * 0.5f - 6, bodyR * 0.15f, 12, 8);
                }
            }

            // ---- 嘴巴 ----
            float mouthY = bodyR * 0.3f;
            using (var mouthPen = new Pen(_eyePupil, 1.8f))
            {
                if (_petStatus.Equals("thinking") || _petMood.Equals("thinking"))
                    g.DrawArc(mouthPen, -4, mouthY + 1, 8, 5, 0, -180); // 微张
                else if (_petStatus.Equals("responding") || _petMood.Equals("happy") || _mouseInside)
                    g.DrawArc(mouthPen, -6, mouthY - 2, 12, 8, 0, -180); // 微笑
                else if (_isSleeping)
                    g.DrawArc(mouthPen, -5, mouthY + 2, 10, 5, 0, 180); // 张嘴
                else if (_petMood.Equals("surprised"))
                    g.DrawEllipse(mouthPen, -4, mouthY - 2, 8, 8); // 惊讶
                else
                    g.DrawArc(mouthPen, -4, mouthY + 1, 8, 5, 0, -180); // 正常
            }

            // ---- 触角 ----
            float antOffset = (float)Math.Sin(_animFrame * 0.1f) * 2;
            if (_petStatus.Equals("thinking")) antOffset = (float)Math.Sin(_animFrame * 0.2f) * 3;

            for (int side = -1; side <= 1; side += 2)
            {
                float ax = side * bodyR * 0.35f;
                float ay = -bodyR - 2 + antOffset * side * 0.5f;
                using (var antPen = new Pen(_bodyColor1, 2.5f))
                    g.DrawCurve(antPen,
                        new PointF[] {
                            new PointF(ax, ay + 5),
                            new PointF(ax + side * 6, ay - 8 + antOffset),
                            new PointF(ax + side * 2, ay - 14 + antOffset * 1.5f)
                        });
                using (var tipBrush = new SolidBrush(_accentColor))
                    g.FillEllipse(tipBrush, ax + side * 1 - 3, ay - 16 + antOffset * 1.5f, 6, 6);
                using (var tipGlow = new SolidBrush(Color.FromArgb(80, Color.White)))
                    g.FillEllipse(tipGlow, ax + side * 1 - 2, ay - 15 + antOffset * 1.5f, 4, 4);
            }
            } // 结束备用绘制else块

            g.ResetTransform();

            if (!string.IsNullOrEmpty(_bubbleText))
                DrawCuteMessageCard(g, _bubbleText);

            // ---- 离线标识 ----
            if (!_bridgeOnline && _offlineCounter > 5)
            {
                using (var offlineFont = new Font("Microsoft YaHei", 8))
                using (var offlineBrush = new SolidBrush(Color.FromArgb(200, 255, 80, 80)))
                    g.DrawString("离线", offlineFont, offlineBrush, PET_W / 2 - 16, PET_H - 34);
            }

            }
        private void DrawCuteMessageCard(Graphics g, string text)
        {
            using (var font = new Font("Microsoft YaHei", 9f, FontStyle.Regular))
            {
                float maxW = PET_W - 12;
                SizeF measured = g.MeasureString(text, font, (int)(maxW - 22));

                float bw = Math.Min(maxW, measured.Width + 22);
                float bh = Math.Min(PET_H - 112, Math.Max(28, measured.Height + 16));
                float bx = (PET_W - bw) / 2f;

                // 轻微上下漂浮，和宠物呼吸感一致
                float floatY = 3f + (float)Math.Sin(_animFrame * 0.08f) * 1.8f;
                float by = floatY;

                var rect = new RectangleF(bx, by, bw, bh);

                using (var shadow = new SolidBrush(Color.FromArgb(34, 126, 100, 180)))
                using (var shadowPath = RoundedRect(new RectangleF(rect.X + 2, rect.Y + 2, rect.Width, rect.Height), 10f))
                    g.FillPath(shadow, shadowPath);

                using (var bg = new LinearGradientBrush(rect,
                    Color.FromArgb(235, 255, 248, 252),
                    Color.FromArgb(230, 244, 250, 255),
                    LinearGradientMode.Vertical))
                using (var bgPath = RoundedRect(rect, 10f))
                    g.FillPath(bg, bgPath);

                using (var border = new Pen(Color.FromArgb(130, 255, 178, 204), 1.1f))
                using (var borderPath = RoundedRect(rect, 10f))
                    g.DrawPath(border, borderPath);

                // 小尾巴（聊天卡片更像从宠物头顶冒出来）
                PointF p1 = new PointF(PET_W / 2f - 8, by + bh - 1);
                PointF p2 = new PointF(PET_W / 2f + 8, by + bh - 1);
                PointF p3 = new PointF(PET_W / 2f, by + bh + 10);
                using (var tail = new SolidBrush(Color.FromArgb(232, 248, 250, 255)))
                    g.FillPolygon(tail, new PointF[] { p1, p2, p3 });
                using (var tailBorder = new Pen(Color.FromArgb(115, 255, 178, 204), 1f))
                    g.DrawPolygon(tailBorder, new PointF[] { p1, p2, p3 });

                // 左上角点缀
                using (var deco = new SolidBrush(Color.FromArgb(160, 255, 172, 196)))
                    g.FillEllipse(deco, bx + 8, by + 7, 5, 5);

                var textRect = new RectangleF(bx + 13, by + 6, bw - 20, bh - 10);
                using (var tb = new SolidBrush(Color.FromArgb(46, 34, 64)))
                    g.DrawString(text, font, tb, textRect);
            }
        }

        private GraphicsPath RoundedRect(RectangleF r, float radius)
        {
            var path = new GraphicsPath();
            float d = radius * 2;
            path.AddArc(r.X, r.Y, d, d, 180, 90);
            path.AddArc(r.Right - d, r.Y, d, d, 270, 90);
            path.AddArc(r.Right - d, r.Bottom - d, d, d, 0, 90);
            path.AddArc(r.X, r.Bottom - d, d, d, 90, 90);
            path.CloseFigure();
            return path;
        }

        // ====== 交互 ======
        private void OnPetClick(object sender, MouseEventArgs e)
        {
            if (e.Button == MouseButtons.Left)
            {
                _isSleeping = false;
                _idleCounter = 0;
                _leftMouseDownPoint = e.Location;
                _leftMouseMoved = false;
                _isFollowingMouse = true;
                _followTarget = Cursor.Position;
            }
            else if (e.Button == MouseButtons.Right)
                ShowContextMenu(e.Location);
        }

        private void OnPetDrag(object sender, MouseEventArgs e)
        {
            if (_isFollowingMouse)
            {
                int dx = e.X - _leftMouseDownPoint.X;
                int dy = e.Y - _leftMouseDownPoint.Y;
                if (dx * dx + dy * dy > 25)
                    _leftMouseMoved = true;
                _followTarget = Cursor.Position;
            }
        }

        private void OnPetMouseUp(object sender, MouseEventArgs e)
        {
            bool wasClick = e.Button == MouseButtons.Left && _isFollowingMouse && !_leftMouseMoved;
            _isFollowingMouse = false;

            if (wasClick)
                CycleManualMood();
        }

        private void CycleManualMood()
        {
            List<string> moods = new List<string>();
            foreach (string mood in _clickMoods)
            {
                if (!_useSkins || _skins.ContainsKey(mood))
                    moods.Add(mood);
            }

            if (moods.Count == 0)
                moods.AddRange(_clickMoods);

            string current = string.IsNullOrEmpty(_manualMood) ? _petMood : _manualMood;
            int currentIndex = moods.IndexOf(current);
            _manualMoodIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % moods.Count;
            _manualMood = moods[_manualMoodIndex];
            _petMood = _manualMood;
            _isSleeping = false;
            _idleActionActive = false;
            _bubbleText = "";
            _localBubbleFrames = 0;
            this.Invalidate();
        }

        private string MoodDisplayName(string mood)
        {
            switch (mood)
            {
                case "normal": return "普通";
                case "happy": return "开心";
                case "surprised": return "惊讶";
                case "sleepy": return "困困";
                case "thinking": return "思考";
                case "shy": return "害羞";
                case "sad": return "难过";
                case "angry": return "生气";
                case "contempt": return "鄙视";
                default: return mood;
            }
        }

        private void ShowLocalBubble(string text, int seconds = 4)
        {
            _bubbleText = text;
            _localBubbleFrames = Math.Max(1, seconds * 20);
            this.Invalidate();
        }

        private void ShowContextMenu(Point loc)
        {
            var menu = new ContextMenuStrip();
            menu.Items.Add("说句话", null, (s, e) => {
                string[] msgs = { "你好呀！", "今天怎么样～", "我在哦", "盯——", "继续摸鱼中..." };
                ShowLocalBubble(msgs[_rng.Next(msgs.Length)]);
            });
            menu.Items.Add("桌宠状态", null, (s, e) => {
                if (_bridgeOnline)
                    ShowLocalBubble(_petStatus.Equals("idle") ? "闲着～" :
                                    _petStatus.Equals("thinking") ? "正在思考..." :
                                    _petStatus.Equals("responding") ? "刚回完消息" :
                                    "忙碌中");
                else
                    ShowLocalBubble("网关未连接");
            });
            menu.Items.Add(_voiceEnabled ? "关闭语音交互" : "开启语音交互", null, (s, e) => {
                ToggleVoiceInteraction();
            });
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("重置位置", null, (s, e) => {
                var screen = Screen.PrimaryScreen.WorkingArea;
                this.Location = new Point(screen.Right - PET_W - 20, screen.Bottom - PET_H - 30);
                ShowLocalBubble("回到原位～");
            });
            menu.Items.Add("退出桌宠", null, (s, e) => {
                ShowLocalBubble("拜拜～", 1);
                var t = new System.Windows.Forms.Timer { Interval = 500 };
                t.Tick += (ss, ee) => { t.Stop(); Application.Exit(); };
                t.Start();
            });
            menu.Show(this, loc);
        }

        private void ToggleVoiceInteraction()
        {
            if (!_bridgeOnline)
            {
                ShowLocalBubble("网关未连接");
                return;
            }

            bool next = !_voiceEnabled;
            try
            {
                _web.Headers[HttpRequestHeader.ContentType] = "application/json; charset=utf-8";
                _web.UploadString(BRIDGE_URL + "/voice", "POST", "{\"enabled\":" + (next ? "true" : "false") + "}");
                _voiceEnabled = next;
                ShowLocalBubble(_voiceEnabled ? "语音交互已开启" : "语音交互已关闭");
            }
            catch
            {
                ShowLocalBubble("语音开关失败");
            }
        }

        // ====== 鼠标穿透处理 ======
        private const int WM_NCHITTEST = 0x84;
        private const int HTTRANSPARENT = -1;
        private const int HTCLIENT = 1;
        private const int HTCAPTION = 2;

        protected override void WndProc(ref Message m)
        {
            if (m.Msg == WM_NCHITTEST)
            {
                // 获取鼠标在窗口内的位置
                Point pt = this.PointToClient(Cursor.Position);

                // 检查是否在宠物身体范围内
                int cx = PET_W / 2, cy = PET_H - PET_CENTER_Y_OFFSET;
                int dx = pt.X - cx, dy = pt.Y - cy;
                float dist = (float)Math.Sqrt(dx * dx + dy * dy);

                if (dist < 66)
                {
                    // 在身体范围内 - 允许点击交互
                    m.Result = (IntPtr)HTCLIENT;
                    return;
                }

                // 不在身体范围内 - 鼠标穿透
                m.Result = (IntPtr)HTTRANSPARENT;
                return;
            }
            base.WndProc(ref m);
        }
    }
}

