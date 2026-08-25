"""Manual test harness for the Distill/Blueprint AgentCore HTTP contract (POST /invocations)."""

import requests
import streamlit as st

AGENTS = {
    "distill": {
        "port": 8080,
        "placeholder": "Users must be able to reset their password via email.",
    },
    "blueprint": {"port": 8081, "placeholder": "Paste an approved StructuredSpec (JSON) here."},
}

st.set_page_config(page_title="Hyperdelivery Agent Tester", layout="wide")
st.title("Hyperdelivery Agent Tester")

with st.sidebar:
    agent_name = st.selectbox("Agent", list(AGENTS.keys()))
    default_url = f"http://127.0.0.1:{AGENTS[agent_name]['port']}/invocations"
    base_url = st.text_input("Endpoint", value=default_url)
    timeout_s = st.number_input("Timeout (s)", min_value=5, max_value=300, value=60)

prompt = st.text_area("Prompt", placeholder=AGENTS[agent_name]["placeholder"], height=200)

if st.button("Invoke", type="primary", disabled=not prompt.strip()):
    with st.spinner(f"Calling {agent_name}..."):
        try:
            resp = requests.post(base_url, json={"prompt": prompt}, timeout=timeout_s)
        except requests.RequestException as exc:
            st.error(f"Request failed: {exc}")
        else:
            if resp.status_code != 200:
                st.error(f"HTTP {resp.status_code}: {resp.text}")
            else:
                body = resp.json()
                if "error" in body:
                    st.error(body["error"])
                else:
                    result = body.get("result", {})
                    if "title" in result:
                        st.subheader(result["title"])
                    if "completeness" in result:
                        st.metric("Completeness score", result["completeness"].get("score"))
                        gaps = result["completeness"].get("gaps") or []
                        if gaps:
                            st.warning("Gaps:\n" + "\n".join(f"- {g}" for g in gaps))
                    if "requirements" in result:
                        st.table(result["requirements"])
                    if "units_of_work" in result:
                        st.table(result["units_of_work"])
                    with st.expander("Raw JSON", expanded="title" not in result):
                        st.json(body)
