import getpass,json,pathlib,subprocess,sys
root=pathlib.Path(__file__).resolve().parent.parent
key=getpass.getpass('Moderator code (hidden): ')
result=subprocess.run(['node',str(root/'tests/integration.mjs')],input=json.dumps({'hostKey':key}),text=True,capture_output=True,cwd=root)
print(result.stdout)
if result.stderr: print(result.stderr,file=sys.stderr)
sys.exit(result.returncode)
